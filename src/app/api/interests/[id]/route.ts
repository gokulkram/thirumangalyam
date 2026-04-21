import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Interest, Conversation } from "@/lib/db/models";

export async function PATCH(
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
    const body = await request.json();
    const { action } = body;

    if (!["accept", "decline", "withdraw"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const interest = await Interest.findById(id);
    if (!interest) {
      return NextResponse.json({ error: "Interest not found" }, { status: 404 });
    }

    if (action === "accept") {
      // Only the recipient can accept
      if (interest.toUserId.toString() !== userId) {
        return NextResponse.json({ error: "Only the recipient can accept" }, { status: 403 });
      }
      if (interest.status !== "pending") {
        return NextResponse.json({ error: "Interest is not pending" }, { status: 400 });
      }

      interest.status = "accepted";
      interest.respondedAt = new Date();
      await interest.save();

      // Create conversation if one doesn't exist
      const existingConversation = await Conversation.findOne({
        participants: { $all: [interest.fromUserId, interest.toUserId] },
      });

      if (!existingConversation) {
        await Conversation.create({
          participants: [interest.fromUserId, interest.toUserId],
          lastMessageAt: new Date(),
        });
      }
    } else if (action === "decline") {
      // Only the recipient can decline
      if (interest.toUserId.toString() !== userId) {
        return NextResponse.json({ error: "Only the recipient can decline" }, { status: 403 });
      }
      if (interest.status !== "pending") {
        return NextResponse.json({ error: "Interest is not pending" }, { status: 400 });
      }

      interest.status = "declined";
      interest.respondedAt = new Date();
      await interest.save();
    } else if (action === "withdraw") {
      // Only the sender can withdraw
      if (interest.fromUserId.toString() !== userId) {
        return NextResponse.json({ error: "Only the sender can withdraw" }, { status: 403 });
      }
      if (interest.status !== "pending") {
        return NextResponse.json({ error: "Can only withdraw pending interests" }, { status: 400 });
      }

      interest.status = "withdrawn";
      await interest.save();
    }

    return NextResponse.json({ interest });
  } catch (error: any) {
    console.error("PATCH /api/interests/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
