import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { ParentInvite, Profile } from "@/lib/db/models";

/**
 * POST /api/invite-parent — Generate an invite link for a parent/guardian
 * Returns a shareable link with a unique token (valid 7 days).
 */
export async function POST() {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Expire any old unused invites for this user
    await ParentInvite.updateMany(
      { userId: session.user.id, used: false },
      { $set: { expiresAt: new Date() } }
    );

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await ParentInvite.create({
      userId: session.user.id,
      token,
      expiresAt,
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/register/parent?invite=${token}`;

    return NextResponse.json({
      success: true,
      inviteLink,
      expiresAt: expiresAt.toISOString(),
      message: "Share this link with your parent or guardian to connect their account.",
    });
  } catch (error: any) {
    console.error("POST /api/invite-parent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate invite" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invite-parent?token=xxx — Validate an invite token
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invite = await ParentInvite.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite link." },
        { status: 404 }
      );
    }

    // Get the child's profile name
    const profile = await Profile.findOne({ userId: (invite as any).userId })
      .select("fullName")
      .lean();

    return NextResponse.json({
      valid: true,
      childName: (profile as any)?.fullName || "User",
      childUserId: (invite as any).userId.toString(),
    });
  } catch (error: any) {
    console.error("GET /api/invite-parent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate invite" },
      { status: 500 }
    );
  }
}
