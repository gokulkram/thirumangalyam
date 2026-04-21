import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Conversation, Profile } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    // Populate other participant's profile
    const results = await Promise.all(
      conversations.map(async (conv: any) => {
        const otherParticipantId = conv.participants.find(
          (p: any) => p.toString() !== userId
        );

        const otherProfile = otherParticipantId
          ? await Profile.findOne({ userId: otherParticipantId })
              .select("userId fullName photos isOnline lastActive")
              .lean()
          : null;

        const unreadCount = conv.unreadCount?.get?.(userId) || conv.unreadCount?.[userId] || 0;

        return {
          ...conv,
          otherParticipant: otherProfile,
          myUnreadCount: unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: results });
  } catch (error: any) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
