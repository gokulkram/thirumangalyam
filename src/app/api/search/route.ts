import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Profile } from "@/lib/db/models";
import { searchResultCache } from "@/lib/cache";

const SEARCH_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // Cache key includes userId so different users never share cached results
    const userId = session.user.id;
    const cacheKey = `search:${userId}:${searchParams.toString()}`;
    const cached = searchResultCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT" },
      });
    }

    // Gather filters
    const q = searchParams.get("q")?.trim() || "";  // name / city text search
    const gender = searchParams.get("gender");
    const ageMin = searchParams.get("ageMin");
    const ageMax = searchParams.get("ageMax");
    const heightMin = searchParams.get("heightMin");
    const heightMax = searchParams.get("heightMax");
    const community = searchParams.get("community");
    const motherTongue = searchParams.get("motherTongue");
    const education = searchParams.get("education");
    const occupation = searchParams.get("occupation");
    const city = searchParams.get("city");
    const maritalStatus = searchParams.get("maritalStatus");
    const diet = searchParams.get("diet");
    const star = searchParams.get("star");
    const hasDosham = searchParams.get("hasDosham");

    // First filter users by gender and status
    const userQuery: any = { status: "active", _id: { $ne: userId } };
    if (gender) userQuery.gender = gender;

    const activeUsers = await User.find(userQuery).select("_id isPremium gender").lean();
    const activeUserIds = activeUsers.map((u: any) => u._id);

    // Build profile query
    const profileQuery: any = { userId: { $in: activeUserIds } };

    if (ageMin || ageMax) {
      profileQuery.age = {};
      if (ageMin) profileQuery.age.$gte = parseInt(ageMin);
      if (ageMax) profileQuery.age.$lte = parseInt(ageMax);
    }
    if (heightMin || heightMax) {
      // Store height filter as string comparison
      if (heightMin) profileQuery.height = { ...profileQuery.height, $gte: heightMin };
      if (heightMax) profileQuery.height = { ...(profileQuery.height || {}), $lte: heightMax };
    }
    if (community) profileQuery.community = community;
    if (motherTongue) profileQuery.motherTongue = motherTongue;
    if (education) profileQuery.highestDegree = education;
    if (occupation) profileQuery.occupation = occupation;
    if (city) profileQuery.city = { $regex: new RegExp(city, "i") };
    if (maritalStatus) profileQuery.maritalStatus = maritalStatus;
    if (diet) profileQuery.diet = diet;
    if (star) profileQuery.star = star;
    if (hasDosham) profileQuery.hasDosham = hasDosham === "true";

    // Server-side name / city text search
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      profileQuery.$or = [
        { fullName: regex },
        { city: regex },
        { occupation: regex },
        { community: regex },
      ];
    }

    const [total, profiles] = await Promise.all([
      Profile.countDocuments(profileQuery),
      Profile.find(profileQuery)
        .sort({ verificationStatus: -1, lastActive: -1 })
        .skip(skip)
        .limit(limit)
        .select("userId fullName age height city state occupation community star photos verificationStatus isOnline lastActive motherTongue maritalStatus diet highestDegree hasDosham")
        .lean(),
    ]);

    // Attach user info and normalize _id → id
    const userMap = new Map(activeUsers.map((u: any) => [u._id.toString(), u]));
    const results = profiles.map((p: any) => {
      const { _id, userId, photos, ...rest } = p;
      const primaryPhoto = (photos || []).find((ph: any) => ph.isPrimary) || (photos || [])[0];
      return {
        ...rest,
        id: _id.toString(),
        profileId: _id.toString(),
        userId: userId.toString(),
        primaryPhotoUrl: primaryPhoto?.url || "",
        isVerified: p.verificationStatus === "verified",
        isPremium: userMap.get(userId.toString())?.isPremium || false,
        gender: (userMap.get(userId.toString()) as any)?.gender || "",
        location: [p.city, p.state].filter(Boolean).join(", ") || "",
        isShortlisted: false,
      };
    });

    const payload = {
      profiles: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    searchResultCache.set(cacheKey, payload, SEARCH_CACHE_TTL);

    return NextResponse.json(payload, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error: any) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
