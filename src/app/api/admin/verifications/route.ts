import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { VerificationRequest, Profile } from "@/lib/db/models";

/**
 * POST /api/admin/verifications — Submit a verification request (user-facing)
 * Body: { documentType, documentUrl, selfieUrl? }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documentType, documentUrl, selfieUrl } = body;

    if (!documentUrl) {
      return NextResponse.json({ error: "Document is required" }, { status: 400 });
    }

    // Check if a pending request already exists
    const existing = await VerificationRequest.findOne({
      userId: session.user.id,
      status: "pending",
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Verification already submitted and pending review.",
      });
    }

    const profile = await Profile.findOne({ userId: session.user.id })
      .select("fullName")
      .lean();

    await VerificationRequest.create({
      userId: session.user.id,
      userName: (profile as any)?.fullName || "",
      documentType: documentType || "aadhaar",
      documentUrl,
      selfieUrl: selfieUrl || "",
      status: "pending",
    });

    // Update profile verification status to pending
    await Profile.findOneAndUpdate(
      { userId: session.user.id },
      { verificationStatus: "pending" }
    );

    return NextResponse.json({
      success: true,
      message: "Verification request submitted. We'll review it within 24 hours.",
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/verifications error:", error);
    return NextResponse.json({ error: error.message || "Submission failed" }, { status: 500 });
  }
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
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (status) query.status = status;

    const [total, requests] = await Promise.all([
      VerificationRequest.countDocuments(query),
      VerificationRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const normalized = requests.map((r: any) => ({
      ...r,
      id: r._id.toString(),
      _id: undefined,
      userId: r.userId?.toString() || "",
      submittedAt: r.createdAt,   // page expects submittedAt, DB has createdAt
    }));

    return NextResponse.json({
      verifications: normalized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/verifications error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
