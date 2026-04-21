import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Conversation, Message, Profile } from "@/lib/db/models";

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

    // Create the message
    const message = await Message.create({
      conversationId: id,
      senderId: userId,
      content: content.trim(),
      type: "text",
      status: "sent",
    });

    // Update conversation
    const otherParticipantId = (conversation as any).participants.find(
      (p: any) => p.toString() !== userId
    );

    await Conversation.findByIdAndUpdate(id, {
      lastMessage: content.trim(),
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${otherParticipantId}`]: 1 },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chat/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
