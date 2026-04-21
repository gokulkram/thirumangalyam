import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Interest, Profile } from "@/lib/db/models";

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
        query = { toUserId: userId };
        populateField = "fromUserId";
        break;
      case "sent":
        query = { fromUserId: userId };
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

        const profile = await Profile.findOne({ userId: otherUserId })
          .select("userId fullName age city occupation community photos verificationStatus isOnline height")
          .lean();

        const primaryPhoto = profile ? ((profile as any).photos || []).find((p: any) => p.isPrimary) || ((profile as any).photos || [])[0] : null;

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
                id: otherUserId,
                profileId: otherUserId,
                fullName: (profile as any).fullName || "",
                age: (profile as any).age || 0,
                height: (profile as any).height || "",
                occupation: (profile as any).occupation || "",
                location: (profile as any).city || "",
                community: (profile as any).community || "",
                primaryPhotoUrl: primaryPhoto?.url || "",
                isVerified: (profile as any).verificationStatus === "verified",
                isPremium: false,
                isOnline: (profile as any).isOnline || false,
                isShortlisted: false,
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

    return NextResponse.json({ interest }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/interests error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
