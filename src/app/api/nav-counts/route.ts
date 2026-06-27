import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Interest, Shortlist, ProfileView, Conversation } from "@/lib/db/models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [pendingReceived, pendingSent, shortlistCount, viewedMeCount, conversations] =
      await Promise.all([
        Interest.countDocuments({ toUserId: userId, status: "pending" }),
        Interest.countDocuments({ fromUserId: userId, status: "pending" }),
        Shortlist.countDocuments({ userId }),
        ProfileView.countDocuments({ viewedUserId: userId }),
        Conversation.find({ participants: userId }).select(`unreadCount`).lean(),
      ]);

    // Sum unread message counts across all conversations for this user
    const unreadMessages = (conversations as any[]).reduce((sum, c) => {
      const count = c.unreadCount instanceof Map
        ? (c.unreadCount.get(userId) ?? 0)
        : (c.unreadCount?.[userId] ?? 0);
      return sum + count;
    }, 0);

    return NextResponse.json({ pendingReceived, pendingSent, shortlistCount, viewedMeCount, unreadMessages });
  } catch (error: any) {
    console.error("GET /api/nav-counts error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
