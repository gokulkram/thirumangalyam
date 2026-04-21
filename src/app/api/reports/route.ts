import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Report, Profile } from "@/lib/db/models";

/**
 * POST /api/reports — Submit a user report
 * Body: { reportedUserId, reason, description? }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportedUserId, reason, description } = await request.json();

    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { error: "reportedUserId and reason are required" },
        { status: 400 }
      );
    }

    if (reportedUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    // Check if already reported by this user
    const existing = await Report.findOne({
      reportedUserId,
      reportedByUserId: session.user.id,
      status: "open",
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "You have already reported this profile. Our team is reviewing it.",
      });
    }

    // Get profile names
    const [reportedProfile, reporterProfile] = await Promise.all([
      Profile.findOne({ userId: reportedUserId }).select("fullName").lean(),
      Profile.findOne({ userId: session.user.id }).select("fullName").lean(),
    ]);

    await Report.create({
      reportedUserId,
      reportedUserName: (reportedProfile as any)?.fullName || "",
      reportedByUserId: session.user.id,
      reportedByUserName: (reporterProfile as any)?.fullName || "",
      reason,
      description: description || "",
      status: "open",
    });

    return NextResponse.json({
      success: true,
      message: "Profile reported. Our team will review it within 24 hours.",
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit report" },
      { status: 500 }
    );
  }
}
