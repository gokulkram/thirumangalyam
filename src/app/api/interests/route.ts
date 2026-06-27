import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Interest, Profile, User, Shortlist } from "@/lib/db/models";
import mongoose from "mongoose";
import { notifyInterestReceived } from "@/lib/notifications/service";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "received";

    let query: any;
    let populateField: string;

    switch (type) {
      case "received":
        query = { toUserId: userId, status: "pending" };
        populateField = "fromUserId";
        break;
      case "sent":
        query = { fromUserId: userId, status: "pending" };
        populateField = "toUserId";
        break;
      case "accepted":
        query = {
          $or: [{ fromUserId: userId }, { toUserId: userId }],
          status: "accepted",
        };
        populateField = ""; // handled below
        break;
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    const interests = await Interest.find(query).sort({ createdAt: -1 }).lean();

    const SELECT = "userId fullName age city occupation community photos verificationStatus isOnline height";

    // Build shortlist set so we can mark isShortlisted accurately
    const myShortlists = await Shortlist.find({ userId }).select("shortlistedUserId").lean();
    const shortlistedIds = new Set(myShortlists.map((s: any) => s.shortlistedUserId.toString()));

    // Get the other user's profile for each interest
    const results = await Promise.all(
      interests.map(async (interest: any) => {
        let otherUserId: string;
        if (type === "accepted") {
          otherUserId =
            interest.fromUserId.toString() === userId
              ? interest.toUserId.toString()
              : interest.fromUserId.toString();
        } else if (type === "received") {
          otherUserId = interest.fromUserId.toString();
        } else {
          otherUserId = interest.toUserId.toString();
        }

        // Primary lookup by userId; fallback by Profile._id (handles mis-stored IDs)
        let profile: any = await Profile.findOne({ userId: otherUserId }).select(SELECT).lean();
        if (!profile && mongoose.Types.ObjectId.isValid(otherUserId)) {
          profile = await Profile.findById(otherUserId).select(SELECT).lean();
        }

        // Fetch real isPremium from User
        const otherUser = await User.findById(otherUserId).select("isPremium").lean() as any;

        const primaryPhoto = profile
          ? ((profile as any).photos || []).find((p: any) => p.isPrimary) || ((profile as any).photos || [])[0]
          : null;

        // Resolve the canonical userId for the profile link
        const resolvedUserId = profile ? (profile as any).userId?.toString() || otherUserId : otherUserId;

        return {
          id: interest._id.toString(),
          fromProfileId: interest.fromUserId.toString(),
          toProfileId: interest.toUserId.toString(),
          status: interest.status,
          note: interest.note || "",
          sentAt: interest.createdAt?.toISOString?.() || new Date().toISOString(),
          respondedAt: interest.respondedAt?.toISOString?.() || undefined,
          profile: profile
            ? {
                id: resolvedUserId,
                profileId: resolvedUserId,
                fullName: (profile as any).fullName || "",
                age: (profile as any).age || 0,
                height: (profile as any).height || "",
                occupation: (profile as any).occupation || "",
                location: (profile as any).city || "",
                community: (profile as any).community || "",
                primaryPhotoUrl: primaryPhoto?.url || "",
                isVerified: (profile as any).verificationStatus === "verified",
                isPremium: otherUser?.isPremium || false,
                isOnline: (profile as any).isOnline || false,
                isShortlisted: shortlistedIds.has(resolvedUserId),
              }
            : null,
        };
      })
    );

    return NextResponse.json({ interests: results });
  } catch (error: any) {
    console.error("GET /api/interests error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { toUserId, note } = body;

    if (!toUserId) {
      return NextResponse.json({ error: "toUserId is required" }, { status: 400 });
    }

    if (toUserId === userId) {
      return NextResponse.json({ error: "Cannot send interest to yourself" }, { status: 400 });
    }

    // Enforce 5 interests/day for free users
    const FREE_DAILY_INTEREST_LIMIT = 5;
    const senderUser = await User.findById(userId).select("isPremium").lean() as any;
    if (!senderUser?.isPremium) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayCount = await Interest.countDocuments({
        fromUserId: userId,
        createdAt: { $gte: startOfToday },
      });
      if (todayCount >= FREE_DAILY_INTEREST_LIMIT) {
        return NextResponse.json(
          {
            error: `Daily limit reached. Free users can send only ${FREE_DAILY_INTEREST_LIMIT} interests per day.`,
            limitReached: true,
            upgradeUrl: "/premium",
          },
          { status: 429 }
        );
      }
    }

    // Check for duplicate
    const existing = await Interest.findOne({
      fromUserId: userId,
      toUserId,
      status: { $in: ["pending", "accepted"] },
    });

    if (existing) {
      return NextResponse.json({ error: "Interest already sent" }, { status: 409 });
    }

    const interest = await Interest.create({
      fromUserId: userId,
      toUserId,
      note,
      status: "pending",
    });

    // Invalidate sender's match pool cache (recipient is now excluded)
    revalidateTag(`matches-${userId}`, "default");

    // Notify recipient — fire-and-forget, never blocks the response
    const senderProfile = await Profile.findOne({ userId }).select("fullName _id").lean();
    notifyInterestReceived({
      toUserId: toUserId,
      fromProfileName: (senderProfile as any)?.fullName || "Someone",
      fromProfileId: (senderProfile as any)?._id?.toString() || userId,
    }).catch(() => {});

    return NextResponse.json({ interest }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/interests error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
