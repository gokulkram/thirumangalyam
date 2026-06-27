import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Report, ActivityLog, User } from "@/lib/db/models";
import { sendEscalationAlertEmail } from "@/lib/mailer";

// Reasons that automatically warrant high severity
const HIGH_SEVERITY_REASONS = new Set(["underage", "harassment", "inappropriate_photos"]);

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
    const { action, resolution, severity } = body;

    if (!["resolve", "dismiss", "escalate"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (action === "escalate") {
      const newSeverity = severity && ["low", "medium", "high", "critical"].includes(severity)
        ? severity
        : "high";

      report.severity = newSeverity;
      report.escalatedAt = new Date();
      report.escalatedBy = session.user.name || "Admin";
      report.autoEscalated = false;
      await report.save();

      // Count open reports against this user for the alert email
      const reportCount = await Report.countDocuments({
        reportedUserId: report.reportedUserId,
        status: "open",
      });

      await sendEscalationAlertEmail({
        reportId: id,
        reportedUserName: report.reportedUserName || report.reportedUserId.toString(),
        reason: report.reason || "other",
        severity: newSeverity,
        reportCount,
        autoEscalated: false,
      }).catch(() => {});

      await ActivityLog.create({
        action: "report_escalated",
        description: `Admin escalated report against ${report.reportedUserName || report.reportedUserId} to ${newSeverity}`,
        userId: report.reportedUserId,
        userName: report.reportedUserName || "",
      });

      return NextResponse.json({ report });
    }

    // resolve / dismiss
    report.status = action === "resolve" ? "resolved" : "dismissed";
    report.resolvedAt = new Date();
    report.resolution = resolution || "";
    await report.save();

    await ActivityLog.create({
      action: `report_${action}`,
      description: `Admin ${action}d report against ${report.reportedUserName || report.reportedUserId}`,
      userId: report.reportedUserId,
      userName: report.reportedUserName || "",
    });

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("PATCH /api/admin/reports/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
