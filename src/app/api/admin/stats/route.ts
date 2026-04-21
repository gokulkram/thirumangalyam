import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import {
  User,
  Profile,
  Subscription,
  VerificationRequest,
  Report,
  Interest,
  ActivityLog,
} from "@/lib/db/models";

export async function GET() {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch all data in parallel
    const [
      allUsers,
      allProfiles,
      revenueResult,
      pendingVerificationsCount,
      openReportsCount,
      newUsersThisWeek,
      activeToday,
      recentActivity,
      allInterests,
    ] = await Promise.all([
      User.find().lean(),
      Profile.find().lean(),
      Subscription.aggregate([
        { $match: { status: { $in: ["active", "expired"] }, startDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      VerificationRequest.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "open" }),
      User.countDocuments({ createdAt: { $gte: startOfWeek } }),
      User.countDocuments({
        $or: [
          { updatedAt: { $gte: startOfToday } },
          { createdAt: { $gte: startOfToday } },
        ],
      }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      Interest.find().lean(),
    ]);

    // Build profile lookup by userId
    const profileMap = new Map<string, any>();
    for (const p of allProfiles) {
      profileMap.set(p.userId.toString(), p);
    }

    // Build interest counts
    const interestsSentMap = new Map<string, number>();
    const interestsReceivedMap = new Map<string, number>();
    for (const interest of allInterests) {
      const fromId = interest.fromUserId.toString();
      const toId = interest.toUserId.toString();
      interestsSentMap.set(fromId, (interestsSentMap.get(fromId) || 0) + 1);
      interestsReceivedMap.set(toId, (interestsReceivedMap.get(toId) || 0) + 1);
    }

    // Compute stats
    const totalUsers = allUsers.length;
    const premiumUsers = allUsers.filter((u: any) => u.isPremium);
    const freeUsersList = allUsers.filter((u: any) => u.plan === "free");
    const maleUsers = allUsers.filter((u: any) => u.gender === "male");
    const femaleUsers = allUsers.filter((u: any) => u.gender === "female");
    const monthlyRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const conversionRate =
      totalUsers > 0
        ? parseFloat(((premiumUsers.length / totalUsers) * 100).toFixed(1))
        : 0;
    const avgProfileCompletion =
      totalUsers > 0
        ? parseFloat(
            (
              allUsers.reduce((sum: number, u: any) => sum + (u.profileComplete || 0), 0) /
              totalUsers
            ).toFixed(1)
          )
        : 0;

    const stats = {
      totalUsers,
      activeToday,
      pendingVerifications: pendingVerificationsCount,
      openReports: openReportsCount,
      monthlyRevenue,
      newUsersThisWeek,
      totalPremiumUsers: premiumUsers.length,
      freeUsers: freeUsersList.length,
      maleUsers: maleUsers.length,
      femaleUsers: femaleUsers.length,
      conversionRate,
      avgProfileCompletion,
    };

    // Build user records array
    const users = allUsers.map((u: any) => {
      const profile = profileMap.get(u._id.toString());
      const uid = u._id.toString();
      return {
        id: uid,
        fullName: profile?.fullName || "Unknown",
        email: u.email || "",
        phone: u.phone || "",
        gender: u.gender,
        age: profile?.age || 0,
        community: profile?.community || "Unknown",
        location: profile?.workLocation || "Unknown",
        plan: u.plan || "free",
        status: u.status || "active",
        isVerified: profile?.verificationStatus === "verified",
        reportsCount: 0,
        profileComplete: u.profileComplete || 0,
        joinedAt: u.createdAt?.toISOString?.() || new Date().toISOString(),
        lastActive: profile?.lastActive?.toISOString?.() || u.updatedAt?.toISOString?.() || new Date().toISOString(),
        primaryPhotoUrl: profile?.photos?.[0]?.url,
        interestsSent: interestsSentMap.get(uid) || 0,
        interestsReceived: interestsReceivedMap.get(uid) || 0,
        profileViews: profile?.profileViews || 0,
        lastLoginIp: "",
      };
    });

    // Build activity log entries
    const activityLog = recentActivity.map((entry: any) => ({
      id: entry._id.toString(),
      action: entry.action || "",
      description: entry.description || "",
      timestamp: entry.createdAt?.toISOString?.() || new Date().toISOString(),
      userId: entry.userId?.toString(),
      userName: entry.userName || "",
    }));

    return NextResponse.json({
      stats,
      activityLog,
      users,
      pendingVerificationsCount,
      openReportsCount,
    });
  } catch (error: any) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
