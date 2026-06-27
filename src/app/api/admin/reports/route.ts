import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Report, ActivityLog } from "@/lib/db/models";
import { sendEscalationAlertEmail } from "@/lib/mailer";

// Reasons that automatically justify high severity
const AUTO_ESCALATE_REASONS = new Set(["underage", "harassment", "fake_profile"]);

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
    const severity = searchParams.get("severity") || "";

    const query: any = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const [total, reports] = await Promise.all([
      Report.countDocuments(query),
      Report.find(query)
        // Escalated/critical reports float to top, then newest
        .sort({ escalatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const normalized = reports.map((r: any) => ({
      ...r,
      id: r._id.toString(),
      _id: undefined,
      reportedUserId: r.reportedUserId?.toString() || "",
      reportedByUserId: r.reportedByUserId?.toString() || "",
    }));

    return NextResponse.json({
      reports: normalized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * POST with action=auto_escalate — scans open reports and promotes users with 3+
 * open reports or specific high-severity reasons to severity=high automatically.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (body.action !== "auto_escalate") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Find users who have 3+ open reports
    const multipleReports = await Report.aggregate([
      { $match: { status: "open", severity: { $in: ["low", "medium"] } } },
      { $group: { _id: "$reportedUserId", count: { $sum: 1 }, reasons: { $push: "$reason" } } },
      { $match: { count: { $gte: 3 } } },
    ]);

    let escalated = 0;

    for (const group of multipleReports) {
      const hasHighReason = group.reasons.some((r: string) => AUTO_ESCALATE_REASONS.has(r));
      const newSeverity = hasHighReason ? "critical" : "high";

      await Report.updateMany(
        { reportedUserId: group._id, status: "open", severity: { $in: ["low", "medium"] } },
        { $set: { severity: newSeverity, escalatedAt: new Date(), autoEscalated: true } }
      );

      // Notify admin
      const sample = await Report.findOne({
        reportedUserId: group._id,
        status: "open",
      }).lean();

      if (sample) {
        await sendEscalationAlertEmail({
          reportId: (sample as any)._id.toString(),
          reportedUserName: (sample as any).reportedUserName || group._id.toString(),
          reason: (sample as any).reason || "multiple",
          severity: newSeverity,
          reportCount: group.count,
          autoEscalated: true,
        }).catch(() => {});
      }

      escalated += group.count;
    }

    // Also escalate individual reports with high-priority reasons that are still low/medium
    const highReasonEscalations = await Report.updateMany(
      {
        status: "open",
        reason: { $in: Array.from(AUTO_ESCALATE_REASONS) },
        severity: { $in: ["low", "medium"] },
        autoEscalated: { $ne: true },
      },
      { $set: { severity: "high", escalatedAt: new Date(), autoEscalated: true } }
    );

    escalated += highReasonEscalations.modifiedCount;

    await ActivityLog.create({
      action: "auto_escalation_run",
      description: `Auto-escalation scan completed. ${escalated} report(s) escalated.`,
    });

    return NextResponse.json({ escalated });
  } catch (error: any) {
    console.error("POST /api/admin/reports error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
