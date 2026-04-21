import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Shortlist, Profile } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shortlists = await Shortlist.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const results = await Promise.all(
      shortlists.map(async (s: any) => {
        const profile = await Profile.findOne({ userId: s.shortlistedUserId })
          .select("userId fullName age height city occupation community star photos verificationStatus isOnline lastActive")
          .lean();
        return { ...s, profile };
      })
    );

    return NextResponse.json({ shortlist: results });
  } catch (error: any) {
    console.error("GET /api/shortlist error:", error);
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

    const body = await request.json();
    const { shortlistedUserId } = body;

    if (!shortlistedUserId) {
      return NextResponse.json({ error: "shortlistedUserId is required" }, { status: 400 });
    }

    // Check for duplicate
    const existing = await Shortlist.findOne({
      userId: session.user.id,
      shortlistedUserId,
    });

    if (existing) {
      return NextResponse.json({ error: "Already shortlisted" }, { status: 409 });
    }

    const shortlist = await Shortlist.create({
      userId: session.user.id,
      shortlistedUserId,
    });

    return NextResponse.json({ shortlist }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/shortlist error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { shortlistedUserId } = body;

    if (!shortlistedUserId) {
      return NextResponse.json({ error: "shortlistedUserId is required" }, { status: 400 });
    }

    const result = await Shortlist.findOneAndDelete({
      userId: session.user.id,
      shortlistedUserId,
    });

    if (!result) {
      return NextResponse.json({ error: "Not found in shortlist" }, { status: 404 });
    }

    return NextResponse.json({ message: "Removed from shortlist" });
  } catch (error: any) {
    console.error("DELETE /api/shortlist error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
