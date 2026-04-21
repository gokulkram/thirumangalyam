import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import {
  User,
  Profile,
  PartnerPreferences,
  Interest,
  Conversation,
  Message,
  Shortlist,
  ProfileView,
  ActivityLog,
} from "@/lib/db/models";

/**
 * PUT /api/account — Deactivate or reactivate profile
 * Body: { action: "deactivate" | "reactivate" }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === "deactivate") {
      await User.findByIdAndUpdate(session.user.id, { status: "inactive" });
      await Profile.findOneAndUpdate(
        { userId: session.user.id },
        { isOnline: false }
      );

      await ActivityLog.create({
        action: "account_deactivated",
        description: "User deactivated their account",
        userId: session.user.id,
      });

      return NextResponse.json({
        success: true,
        message: "Profile deactivated. You can reactivate anytime by logging in.",
      });
    }

    if (action === "reactivate") {
      await User.findByIdAndUpdate(session.user.id, { status: "active" });

      await ActivityLog.create({
        action: "account_reactivated",
        description: "User reactivated their account",
        userId: session.user.id,
      });

      return NextResponse.json({
        success: true,
        message: "Profile reactivated successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PUT /api/account error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update account" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/account — Permanently delete account and all associated data
 */
export async function DELETE() {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all user data in parallel
    await Promise.all([
      Profile.deleteOne({ userId }),
      PartnerPreferences.deleteOne({ userId }),
      Interest.deleteMany({ $or: [{ fromUserId: userId }, { toUserId: userId }] }),
      Shortlist.deleteMany({ $or: [{ userId }, { shortlistedUserId: userId }] }),
      ProfileView.deleteMany({ $or: [{ viewerId: userId }, { viewedUserId: userId }] }),
      // Delete conversations where user is a participant
      Conversation.find({ participants: userId }).then(async (convos) => {
        const convoIds = convos.map((c: any) => c._id);
        await Message.deleteMany({ conversationId: { $in: convoIds } });
        await Conversation.deleteMany({ _id: { $in: convoIds } });
      }),
    ]);

    // Log before deleting user
    await ActivityLog.create({
      action: "account_deleted",
      description: "User permanently deleted their account",
      userId,
    });

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: "Account permanently deleted.",
    });
  } catch (error: any) {
    console.error("DELETE /api/account error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
