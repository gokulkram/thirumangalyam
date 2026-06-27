import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { BlockedUser, Profile } from "@/lib/db/models";

/**
 * GET /api/block — List all blocked users
 */
export async function GET() {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blocked = await BlockedUser.find({ userId: session.user.id }).lean();

    // Populate blocked user profiles
    const blockedUserIds = blocked.map((b: any) => b.blockedUserId);
    const profiles = await Profile.find({ userId: { $in: blockedUserIds } })
      .select("userId fullName photos")
      .lean();

    const profileMap = new Map<string, any>();
    for (const p of profiles) {
      profileMap.set((p as any).userId.toString(), p);
    }

    const results = blocked.map((b: any) => {
      const profile = profileMap.get(b.blockedUserId.toString());
      const primaryPhoto = (profile?.photos || []).find((ph: any) => ph.isPrimary) || (profile?.photos || [])[0];
      return {
        id: b._id.toString(),
        blockedUserId: b.blockedUserId.toString(),
        fullName: profile?.fullName || "Unknown",
        primaryPhotoUrl: primaryPhoto?.url || "",
        blockedAt: b.createdAt?.toISOString?.() || new Date().toISOString(),
      };
    });

    return NextResponse.json({ blocked: results });
  } catch (error: any) {
    console.error("GET /api/block error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/block — Block a user
 * Body: { blockedUserId: string }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blockedUserId } = await request.json();

    if (!blockedUserId) {
      return NextResponse.json({ error: "blockedUserId is required" }, { status: 400 });
    }

    if (blockedUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    // Check if already blocked
    const existing = await BlockedUser.findOne({
      userId: session.user.id,
      blockedUserId,
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "User already blocked" });
    }

    await BlockedUser.create({
      userId: session.user.id,
      blockedUserId,
    });

    revalidateTag(`matches-${session.user.id}`, "default");

    return NextResponse.json({
      success: true,
      message: "User blocked. They can no longer see your profile.",
    });
  } catch (error: any) {
    console.error("POST /api/block error:", error);
    return NextResponse.json({ error: error.message || "Failed to block user" }, { status: 500 });
  }
}

/**
 * DELETE /api/block — Unblock a user
 * Body: { blockedUserId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blockedUserId } = await request.json();

    if (!blockedUserId) {
      return NextResponse.json({ error: "blockedUserId is required" }, { status: 400 });
    }

    await BlockedUser.deleteOne({
      userId: session.user.id,
      blockedUserId,
    });

    revalidateTag(`matches-${session.user.id}`, "default");

    return NextResponse.json({
      success: true,
      message: "User unblocked.",
    });
  } catch (error: any) {
    console.error("DELETE /api/block error:", error);
    return NextResponse.json({ error: error.message || "Failed to unblock user" }, { status: 500 });
  }
}
