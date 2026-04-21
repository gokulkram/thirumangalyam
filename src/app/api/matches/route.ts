import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Profile, PartnerPreferences, Interest } from "@/lib/db/models";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    // Get current user data
    const [myProfile, myPreferences, myUser] = await Promise.all([
      Profile.findOne({ userId }).lean(),
      PartnerPreferences.findOne({ userId }).lean(),
      User.findById(userId).lean(),
    ]);

    if (!myProfile || !myUser) {
      return NextResponse.json({ error: "Complete your profile first" }, { status: 400 });
    }

    // Get IDs of users already sent interest to
    const sentInterests = await Interest.find({
      fromUserId: userId,
      status: { $in: ["pending", "accepted"] },
    }).select("toUserId").lean();
    const excludeIds = sentInterests.map((i: any) => i.toUserId);
    excludeIds.push(userId); // Exclude self

    // Determine opposite gender
    const oppositeGender = (myUser as any).gender === "male" ? "female" : "male";

    // Find opposite gender active users
    const oppositeUsers = await User.find({
      gender: oppositeGender,
      status: "active",
      _id: { $nin: excludeIds },
    }).select("_id isPremium profileComplete").lean();

    const oppositeUserIds = oppositeUsers.map((u: any) => u._id);

    // Only hard filter: opposite gender active users (no preference filters)
    const profileQuery: any = { userId: { $in: oppositeUserIds } };

    // Fetch all candidate profiles
    const profiles = await Profile.find(profileQuery)
      .select("userId fullName age height city occupation community star photos verificationStatus isOnline lastActive motherTongue maritalStatus diet highestDegree")
      .lean();

    // Build preference matchers for scoring
    const pp = (myPreferences as any) || {};
    const myCommunity = (myProfile as any).community || "";

    // Preferred communities = user's selected preferences + own community
    const preferredCommunities: string[] = [];
    if (myCommunity) preferredCommunities.push(myCommunity);
    if (pp.communities && pp.communities.length > 0) {
      for (const c of pp.communities) {
        if (!preferredCommunities.includes(c)) preferredCommunities.push(c);
      }
    }

    // Score each profile based on how well it matches preferences
    const userMap = new Map(oppositeUsers.map((u: any) => [u._id.toString(), u]));

    const scored = profiles.map((p: any) => {
      let score = 0;

      // Community match (highest priority — worth 100 points)
      if (preferredCommunities.length > 0 && preferredCommunities.includes(p.community)) {
        score += 100;
      }

      // Age match (worth 20 points)
      if (pp.ageRange && pp.ageRange.length === 2 && p.age) {
        if (p.age >= pp.ageRange[0] && p.age <= pp.ageRange[1]) {
          score += 20;
        }
      }

      // Mother tongue match (worth 15 points)
      if (pp.motherTongues && pp.motherTongues.length > 0) {
        if (pp.motherTongues.includes(p.motherTongue)) score += 15;
      }

      // Location match (worth 15 points)
      if (pp.locations && pp.locations.length > 0) {
        if (pp.locations.includes(p.city)) score += 15;
      }

      // Marital status match (worth 10 points)
      if (pp.maritalStatus && pp.maritalStatus.length > 0) {
        if (pp.maritalStatus.includes(p.maritalStatus)) score += 10;
      }

      // Education match (worth 10 points)
      if (pp.education && pp.education.length > 0) {
        if (pp.education.includes(p.highestDegree)) score += 10;
      }

      // Occupation match (worth 10 points)
      if (pp.occupation && pp.occupation.length > 0) {
        if (pp.occupation.includes(p.occupation)) score += 10;
      }

      // Diet match (worth 5 points)
      if (pp.diet === "must_veg" && p.diet === "vegetarian") {
        score += 5;
      }

      // Verified bonus (worth 10 points)
      if (p.verificationStatus === "verified") score += 10;

      // Profile completeness bonus
      const u = userMap.get(p.userId.toString());
      const profileComplete = u?.profileComplete || 0;
      score += Math.round(profileComplete / 10); // 0-10 points

      const { _id, userId: pUserId, photos, ...rest } = p;
      const primaryPhoto = (photos || []).find((ph: any) => ph.isPrimary) || (photos || [])[0];

      return {
        ...rest,
        id: _id.toString(),
        profileId: _id.toString(),
        userId: pUserId.toString(),
        primaryPhotoUrl: primaryPhoto?.url || "",
        isVerified: p.verificationStatus === "verified",
        isPremium: u?.isPremium || false,
        profileComplete,
        location: [p.city].filter(Boolean).join(", ") || "",
        isShortlisted: false,
        matchScore: score,
        isCommunityMatch: preferredCommunities.includes(p.community),
      };
    });

    // Sort: community matches first, then by score descending
    scored.sort((a, b) => {
      // Community matches always first
      if (a.isCommunityMatch !== b.isCommunityMatch) {
        return a.isCommunityMatch ? -1 : 1;
      }
      // Then by match score
      return b.matchScore - a.matchScore;
    });

    // Paginate after sorting
    const total = scored.length;
    const start = (page - 1) * limit;
    const paged = scored.slice(start, start + limit);

    return NextResponse.json({
      profiles: paged,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
