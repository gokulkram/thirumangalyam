import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Report, ActivityLog } from "@/lib/db/models";

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
    const { action, resolution } = body;

    if (!["resolve", "dismiss"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    report.status = action === "resolve" ? "resolved" : "dismissed";
    report.resolvedAt = new Date();
    report.resolution = resolution || "";
    await report.save();

    // Log activity
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
