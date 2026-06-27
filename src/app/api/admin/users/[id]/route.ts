import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import {
  User,
  Profile,
  Interest,
  Subscription,
  ActivityLog,
  Report,
  LoginEvent,
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

    const [user, profile, interests, subscriptions, reports, activityLogs, lastLogin] =
      await Promise.all([
        User.findById(id).select("-password").lean(),
        Profile.findOne({ userId: id }).lean(),
        Interest.find({ $or: [{ fromUserId: id }, { toUserId: id }] })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
        Subscription.find({ userId: id }).sort({ createdAt: -1 }).lean(),
        Report.find({ $or: [{ reportedUserId: id }, { reportedByUserId: id }] })
          .sort({ createdAt: -1 })
          .lean(),
        ActivityLog.find({ userId: id })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        LoginEvent.findOne({ userId: id })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const p = profile as any;
    const u = user as any;

    // Primary photo
    const primaryPhoto =
      (p?.photos || []).find((ph: any) => ph.isPrimary) || (p?.photos || [])[0];

    // Derived counts
    const interestsSent = (interests as any[]).filter(
      (i) => i.fromUserId?.toString() === id
    ).length;
    const interestsReceived = (interests as any[]).filter(
      (i) => i.toUserId?.toString() === id
    ).length;

    // Merge user + profile into one flat object the page expects
    const merged = {
      // identifiers
      id: u._id.toString(),
      // User-level
      email: u.email || "",
      phone: u.phone || "",
      gender: u.gender || "",
      status: u.status || "active",
      role: u.role || "individual",
      isPremium: u.isPremium || false,
      plan: u.plan || "free",
      profileComplete: u.profileComplete || 0,
      // Dates — createdAt is the User's join date
      joinedAt: u.createdAt || null,
      // Profile-level
      fullName: p?.fullName || u.email || "Unknown",
      age: p?.age ?? null,
      community: p?.community || "",
      location: [p?.city, p?.state].filter(Boolean).join(", ") || "",
      city: p?.city || "",
      state: p?.state || "",
      occupation: p?.occupation || "",
      verificationStatus: p?.verificationStatus || "unverified",
      isVerified: p?.verificationStatus === "verified",
      profileViews: p?.profileViews || 0,
      lastActive: p?.lastActive || null,
      primaryPhotoUrl: primaryPhoto?.url || "",
      // Computed
      interestsSent,
      interestsReceived,
      reportsCount: (reports as any[]).filter(
        (r) => r.reportedUserId?.toString() === id
      ).length,
      // Last login IP from LoginEvent
      lastLoginIp: (lastLogin as any)?.ip || "—",
    };

    // Normalize subscriptions
    const normalizedSubs = (subscriptions as any[]).map((s) => ({
      ...s,
      id: s._id.toString(),
      _id: undefined,
      userId: s.userId?.toString(),
    }));

    // Normalize reports
    const normalizedReports = (reports as any[]).map((r) => ({
      ...r,
      id: r._id.toString(),
      _id: undefined,
      reportedUserId: r.reportedUserId?.toString(),
      reportedByUserId: r.reportedByUserId?.toString(),
    }));

    // Normalize activity log — page uses entry.timestamp
    const normalizedActivity = (activityLogs as any[]).map((a) => ({
      id: a._id.toString(),
      action: a.action || "",
      description: a.description || "",
      timestamp: a.createdAt || null,
    }));

    return NextResponse.json({
      user: merged,
      subscriptions: normalizedSubs,
      reports: normalizedReports,
      activityLog: normalizedActivity,
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
    const { action, reason } = body;

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
      case "suspend":   user.status = "suspended"; break;
      case "ban":       user.status = "banned";    break;
      case "activate":  user.status = "active";    break;
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

    await ActivityLog.create({
      action: `user_${action}`,
      description: reason
        ? `Admin ${action} user ${userName} (${id}). Reason: ${reason}`
        : `Admin ${action} user ${userName} (${id})`,
      userId: id,
      userName,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
