import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import {
  User,
  Profile,
  PartnerPreferences,
  Interest,
  Subscription,
  ActivityLog,
} from "@/lib/db/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [user, profile, partnerPreferences, interests, subscriptions] =
      await Promise.all([
        User.findById(id).select("-password").lean(),
        Profile.findOne({ userId: id }).lean(),
        PartnerPreferences.findOne({ userId: id }).lean(),
        Interest.find({
          $or: [{ fromUserId: id }, { toUserId: id }],
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
        Subscription.find({ userId: id }).sort({ createdAt: -1 }).lean(),
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: { ...user, id: (user as any)._id?.toString() },
      profile,
      partnerPreferences,
      interests: (interests as any[]).map((i) => ({
        ...i,
        id: i._id.toString(),
        _id: undefined,
        fromUserId: i.fromUserId?.toString(),
        toUserId: i.toUserId?.toString(),
      })),
      subscriptions: (subscriptions as any[]).map((s) => ({
        ...s,
        id: s._id.toString(),
        _id: undefined,
        userId: s.userId?.toString(),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!["suspend", "ban", "activate", "make_premium", "downgrade"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await Profile.findOne({ userId: id }).select("fullName").lean();
    const userName = (profile as any)?.fullName || "Unknown";

    switch (action) {
      case "suspend":
        user.status = "suspended";
        break;
      case "ban":
        user.status = "banned";
        break;
      case "activate":
        user.status = "active";
        break;
      case "make_premium":
        user.isPremium = true;
        user.plan = "premium_12";
        break;
      case "downgrade":
        user.isPremium = false;
        user.plan = "free";
        break;
    }

    await user.save();

    // Log activity
    await ActivityLog.create({
      action: `user_${action}`,
      description: `Admin ${action} user ${userName} (${id})`,
      userId: id,
      userName,
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
