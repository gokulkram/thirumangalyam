import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Profile, PartnerPreferences, Interest, BlockedUser } from "@/lib/db/models";

const FREE_MATCH_LIMIT = 10;

// ─── Cached scoring pool ───────────────────────────────────────────────────
// The expensive part: fetches ALL opposite-gender profiles + scores them.
// Cached per user for 5 minutes; invalidated by revalidateTag when the user
// sends/withdraws an interest or blocks/unblocks someone.
function getScoredPool(userId: string) {
  return unstable_cache(
    async () => {
      await connectDB();

      const [myProfile, myPreferences, myUser, sentInterests, blockedByMe, blockedMe] =
        await Promise.all([
          Profile.findOne({ userId }).lean(),
          PartnerPreferences.findOne({ userId }).lean(),
          User.findById(userId).select("_id isPremium gender").lean(),
          Interest.find({ fromUserId: userId, status: { $in: ["pending", "accepted"] } })
            .select("toUserId")
            .lean(),
          BlockedUser.find({ userId }).select("blockedUserId").lean(),
          BlockedUser.find({ blockedUserId: userId }).select("userId").lean(),
        ]);

      if (!myUser || !myProfile) {
        return { scored: [], errorCode: !myUser ? "user_not_found" : "no_profile" } as const;
      }

      const excludeIds: any[] = [
        userId,
        ...sentInterests.map((i: any) => i.toUserId),
        ...blockedByMe.map((b: any) => b.blockedUserId),
        ...blockedMe.map((b: any) => b.userId),
      ];

      const oppositeGender = (myUser as any).gender === "male" ? "female" : "male";

      const oppositeUsers = await User.find({
        gender: oppositeGender,
        status: "active",
        _id: { $nin: excludeIds },
      })
        .select("_id isPremium profileComplete gender")
        .lean();

      const oppositeUserIds = oppositeUsers.map((u: any) => u._id);

      const profiles = await Profile.find({ userId: { $in: oppositeUserIds } })
        .select(
          "userId fullName age height city occupation community star photos verificationStatus " +
          "isOnline lastActive motherTongue maritalStatus diet highestDegree createdAt"
        )
        .lean();

      const pp = (myPreferences as any) || {};
      const myCommunity = (myProfile as any).community || "";

      const preferredCommunities: string[] = [];
      if (myCommunity) preferredCommunities.push(myCommunity);
      if (pp.communities?.length) {
        for (const c of pp.communities) {
          if (!preferredCommunities.includes(c)) preferredCommunities.push(c);
        }
      }

      const userMap = new Map(oppositeUsers.map((u: any) => [u._id.toString(), u]));

      const scored = profiles.map((p: any) => {
        let score = 0;

        if (preferredCommunities.length && preferredCommunities.includes(p.community)) score += 100;
        if (pp.ageRange?.length === 2 && p.age != null) {
          if (p.age >= pp.ageRange[0] && p.age <= pp.ageRange[1]) score += 20;
        }
        if (pp.motherTongues?.length && pp.motherTongues.includes(p.motherTongue)) score += 15;
        if (pp.locations?.length && pp.locations.includes(p.city)) score += 15;
        if (pp.maritalStatus?.length && pp.maritalStatus.includes(p.maritalStatus)) score += 10;
        if (pp.education?.length && pp.education.includes(p.highestDegree)) score += 10;
        if (pp.occupation?.length && pp.occupation.includes(p.occupation)) score += 10;
        if (pp.diet === "must_veg" && p.diet === "vegetarian") score += 5;
        if (p.verificationStatus === "verified") score += 10;

        const u = userMap.get(p.userId.toString());
        const profileComplete = u?.profileComplete || 0;
        score += Math.round(profileComplete / 10);

        const MAX_SCORE = 205;
        const compatibilityScore = Math.min(100, Math.round((score / MAX_SCORE) * 100));

        const { _id, userId: pUserId, photos, createdAt, ...rest } = p;
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
          location: p.city || "",
          isShortlisted: false,
          compatibilityScore,
          isCommunityMatch: preferredCommunities.includes(p.community),
          joinedAt: createdAt ? new Date(createdAt).toISOString() : null,
          gender: (u as any)?.gender || oppositeGender,
        };
      });

      // Community matches first, then by score
      scored.sort((a, b) => {
        if (a.isCommunityMatch !== b.isCommunityMatch) return a.isCommunityMatch ? -1 : 1;
        return b.compatibilityScore - a.compatibilityScore;
      });

      return { scored, errorCode: undefined } as const;
    },
    [`matches-pool-${userId}`],
    { revalidate: 300, tags: [`matches-${userId}`] }
  )();
}

// ─── Route handler ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    // Resolve premium status (not cached — must be fresh)
    await connectDB();
    const myUser = await User.findById(userId).select("isPremium").lean();
    if (!myUser) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }
    const isPremiumUser = !!(myUser as any).isPremium;

    // Pull from cache (or compute + cache on miss)
    const { scored, errorCode } = await getScoredPool(userId);

    if (errorCode === "user_not_found") {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }
    if (errorCode === "no_profile") {
      return NextResponse.json({ error: "Complete your profile first" }, { status: 400 });
    }

    const effectiveLimit = isPremiumUser ? limit : Math.min(limit, FREE_MATCH_LIMIT);
    const totalAvailable = scored.length;
    const start = (page - 1) * effectiveLimit;
    const paged = scored.slice(start, start + effectiveLimit);

    return NextResponse.json({
      profiles: paged,
      isPremium: isPremiumUser,
      totalAvailable,
      lockedCount: isPremiumUser ? 0 : Math.max(0, totalAvailable - FREE_MATCH_LIMIT),
      pagination: {
        page,
        limit: effectiveLimit,
        total: isPremiumUser ? totalAvailable : Math.min(totalAvailable, FREE_MATCH_LIMIT),
        totalPages: Math.ceil(
          (isPremiumUser ? totalAvailable : Math.min(totalAvailable, FREE_MATCH_LIMIT)) /
            effectiveLimit
        ),
      },
    });
  } catch (error: any) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
