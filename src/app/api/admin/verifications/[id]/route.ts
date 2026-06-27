import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { VerificationRequest, Profile, ActivityLog } from "@/lib/db/models";
import {
  notifyVerificationApproved,
  notifyVerificationRejected,
} from "@/lib/notifications/service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const verification = await VerificationRequest.findById(id);
    if (!verification) {
      return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
    }

    if (action === "approve") {
      verification.status = "approved";
      verification.reviewedAt = new Date();
      verification.reviewedBy = session.user.id;
      await verification.save();

      await Profile.findOneAndUpdate(
        { userId: verification.userId },
        { verificationStatus: "verified" }
      );

      // Notify user — fire-and-forget
      notifyVerificationApproved({
        userId: verification.userId.toString(),
      }).catch(() => {});
    } else {
      verification.status = "rejected";
      verification.reviewedAt = new Date();
      verification.reviewedBy = session.user.id;
      verification.rejectionReason = rejectionReason || "";
      await verification.save();

      await Profile.findOneAndUpdate(
        { userId: verification.userId },
        { verificationStatus: "unverified" }
      );

      // Notify user with rejection reason — fire-and-forget
      notifyVerificationRejected({
        userId: verification.userId.toString(),
        reason: rejectionReason || "Document did not meet verification criteria.",
      }).catch(() => {});
    }

    await ActivityLog.create({
      action: `verification_${action}`,
      description: `Admin ${action}ed verification for ${verification.userName || verification.userId}`,
      userId: verification.userId,
      userName: verification.userName || "",
    });

    return NextResponse.json({ verification });
  } catch (error: any) {
    console.error("PATCH /api/admin/verifications/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
