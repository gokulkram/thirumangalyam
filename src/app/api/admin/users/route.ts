import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Profile, Interest } from "@/lib/db/models";

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const gender = searchParams.get("gender") || "";
    const isPremium = searchParams.get("isPremium") || "";

    // Build user query
    const userQuery: any = {};
    if (status) userQuery.status = status;
    if (gender) userQuery.gender = gender;
    if (isPremium === "true") userQuery.isPremium = true;
    if (isPremium === "false") userQuery.isPremium = false;

    // If search is provided, find matching profiles first
    if (search) {
      const escapedSearch = escapeRegex(search);
      const matchingProfiles = await Profile.find({
        $or: [
          { fullName: { $regex: new RegExp(escapedSearch, "i") } },
          { workLocation: { $regex: new RegExp(escapedSearch, "i") } },
          { community: { $regex: new RegExp(escapedSearch, "i") } },
        ],
      })
        .select("userId")
        .lean();

      const profileUserIds = matchingProfiles.map((p: any) => p.userId);

      userQuery.$or = [
        { phone: { $regex: new RegExp(escapedSearch, "i") } },
        { email: { $regex: new RegExp(escapedSearch, "i") } },
        { _id: { $in: profileUserIds } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(userQuery),
      User.find(userQuery)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Attach profile data
    const userIds = users.map((u: any) => u._id);
    const [profiles, interests] = await Promise.all([
      Profile.find({ userId: { $in: userIds } }).lean(),
      Interest.find({
        $or: [
          { fromUserId: { $in: userIds } },
          { toUserId: { $in: userIds } },
        ],
      }).lean(),
    ]);

    const profileMap = new Map(
      profiles.map((p: any) => [p.userId.toString(), p])
    );

    // Build interest counts
    const interestsSentMap = new Map<string, number>();
    const interestsReceivedMap = new Map<string, number>();
    for (const interest of interests) {
      const fromId = (interest as any).fromUserId.toString();
      const toId = (interest as any).toUserId.toString();
      interestsSentMap.set(fromId, (interestsSentMap.get(fromId) || 0) + 1);
      interestsReceivedMap.set(toId, (interestsReceivedMap.get(toId) || 0) + 1);
    }

    // Flatten user + profile into UserRecord shape
    const results = users.map((u: any) => {
      const profile = profileMap.get(u._id.toString());
      const uid = u._id.toString();
      return {
        id: uid,
        fullName: profile?.fullName || "Unknown",
        email: u.email || "",
        phone: u.phone || "",
        gender: u.gender || "male",
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

    return NextResponse.json({
      users: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
