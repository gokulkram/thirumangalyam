import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Profile } from "@/lib/db/models";
import { computePoruthams, doshamResult } from "@/lib/horoscope";
import type { HoroscopeMatch } from "@/types";

/**
 * GET /api/horoscope-match/[id]
 * Returns porutham analysis between the current user and the profile [id].
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch both profiles in parallel
    const [myProfile, otherProfile] = await Promise.all([
      Profile.findOne({ userId: session.user.id })
        .select("fullName star rashi hasDosham")
        .lean(),
      Profile.findOne({ userId: id })
        .select("fullName star rashi hasDosham")
        .lean(),
    ]);

    if (!myProfile) {
      return NextResponse.json({ error: "Your profile not found" }, { status: 404 });
    }
    if (!otherProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const starA = (myProfile as any).star || "";
    const starB = (otherProfile as any).star || "";
    const rashiA = (myProfile as any).rashi || "";
    const rashiB = (otherProfile as any).rashi || "";
    const doshamA = (myProfile as any).hasDosham;
    const doshamB = (otherProfile as any).hasDosham;

    const { poruthams, matchedCount, totalCount } = computePoruthams(
      starA,
      starB,
      rashiA,
      rashiB
    );

    const overallScore = totalCount === 0 ? 0 : Math.round((matchedCount / totalCount) * 100);

    let label = "Poor Match";
    if (overallScore >= 80) label = "Excellent Match";
    else if (overallScore >= 60) label = "Good Match";
    else if (overallScore >= 40) label = "Average Match";

    const result: HoroscopeMatch = {
      profileA: {
        name: (myProfile as any).fullName || "",
        star: starA,
        rashi: rashiA,
        hasDosham: doshamA,
      },
      profileB: {
        name: (otherProfile as any).fullName || "",
        star: starB,
        rashi: rashiB,
        hasDosham: doshamB,
      },
      overallScore,
      maxScore: 100,
      label,
      poruthams,
      doshamResult: doshamResult(doshamA, doshamB),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/horoscope-match/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
