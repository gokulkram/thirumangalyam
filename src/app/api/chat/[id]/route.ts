import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Conversation, Message, Profile } from "@/lib/db/models";
import { filterMessage, checkMessageRateLimit } from "@/lib/security/content-filter";
import { notifyNewMessage } from "@/lib/notifications/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Verify user is a participant
    const conversation = await Conversation.findById(id).lean();
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = (conversation as any).participants.some(
      (p: any) => p.toString() === userId
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    // Get messages sorted by createdAt ascending
    const [total, messages] = await Promise.all([
      Message.countDocuments({ conversationId: id }),
      Message.find({ conversationId: id })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversationId: id,
        senderId: { $ne: userId },
        isRead: false,
      },
      { $set: { isRead: true, status: "read" } }
    );

    // Reset unread count for this user
    await Conversation.findByIdAndUpdate(id, {
      $set: { [`unreadCount.${userId}`]: 0 },
    });

    // Get other participant's profile
    const otherParticipantId = (conversation as any).participants.find(
      (p: any) => p.toString() !== userId
    );
    const otherProfile = otherParticipantId
      ? await Profile.findOne({ userId: otherParticipantId })
          .select("userId fullName photos isOnline lastActive")
          .lean()
      : null;

    return NextResponse.json({
      messages,
      otherParticipant: otherProfile,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/chat/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Verify user is a participant
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = (conversation as any).participants.some(
      (p: any) => p.toString() === userId
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Rate limit: max 20 messages per user per minute
    if (!checkMessageRateLimit(userId)) {
      return NextResponse.json({ error: "Too many messages. Please slow down." }, { status: 429 });
    }

    const trimmed = content.trim();
    const filterResult = filterMessage(trimmed);

    if (filterResult.blocked) {
      const hints: Record<string, string> = {
        phone_number: "Sharing phone numbers is not allowed in chat.",
        contact_exchange: "Exchanging contact details is not permitted here.",
        explicit_content: "Your message contains inappropriate content.",
      };
      return NextResponse.json(
        { error: hints[filterResult.reason] || "Message not allowed." },
        { status: 422 }
      );
    }

    // Create the message (flagged ones are stored but marked for review)
    const message = await Message.create({
      conversationId: id,
      senderId: userId,
      content: trimmed,
      type: "text",
      status: "sent",
      isFiltered: filterResult.flagged,
      filterReason: filterResult.reason,
    });

    // Update conversation
    const otherParticipantId = (conversation as any).participants.find(
      (p: any) => p.toString() !== userId
    );

    await Conversation.findByIdAndUpdate(id, {
      lastMessage: trimmed,
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${otherParticipantId}`]: 1 },
    });

    // Notify the other participant — throttled, fire-and-forget
    if (otherParticipantId) {
      const { Profile: ProfileModel } = await import("@/lib/db/models");
      const senderProfile = await ProfileModel.findOne({ userId }).select("fullName").lean();
      notifyNewMessage({
        toUserId: otherParticipantId.toString(),
        fromProfileName: (senderProfile as any)?.fullName || "Someone",
        conversationId: id,
        messagePreview: trimmed,
      }).catch(() => {});
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chat/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
