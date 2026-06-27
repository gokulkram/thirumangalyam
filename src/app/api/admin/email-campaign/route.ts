import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Profile, ActivityLog } from "@/lib/db/models";
import { sendEmailToRecipients } from "@/lib/mailer";

type Segment = "all" | "free" | "premium" | "inactive_30d" | "inactive_60d" | "unverified";

function buildUserFilter(segment: Segment) {
  const now = new Date();
  switch (segment) {
    case "free":
      return { plan: "free", status: "active" };
    case "premium":
      return { isPremium: true, status: "active" };
    case "inactive_30d": {
      const cutoff = new Date(now.getTime() - 30 * 86400000);
      return { status: "active", updatedAt: { $lt: cutoff } };
    }
    case "inactive_60d": {
      const cutoff = new Date(now.getTime() - 60 * 86400000);
      return { status: "active", updatedAt: { $lt: cutoff } };
    }
    case "unverified":
      return { status: "active" }; // filtered further via profile
    default:
      return { status: "active" }; // all active
  }
}

/** GET /api/admin/email-campaign — preview count for a segment */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const segment = (request.nextUrl.searchParams.get("segment") || "all") as Segment;
    const filter = buildUserFilter(segment);
    const total = await User.countDocuments({ ...filter, email: { $exists: true, $ne: null, $gt: "" } });
    return NextResponse.json({ total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

/** POST /api/admin/email-campaign — send campaign */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, html, segment = "all" } = body as { subject: string; html: string; segment: Segment };

    if (!subject?.trim() || !html?.trim()) {
      return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
    }

    const filter = buildUserFilter(segment);
    const users = await User.find({ ...filter, email: { $exists: true, $ne: null, $gt: "" } })
      .select("_id email")
      .lean();

    if (!users.length) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0 });
    }

    // Enrich with names from profiles
    const userIds = (users as any[]).map((u) => u._id);
    const profiles = await Profile.find({ userId: { $in: userIds } }).select("userId fullName").lean();
    const nameMap = new Map((profiles as any[]).map((p) => [p.userId.toString(), p.fullName]));

    const recipients = (users as any[]).map((u) => ({
      email: u.email as string,
      name: nameMap.get(u._id.toString()) || "Member",
    }));

    const { sent, failed } = await sendEmailToRecipients(recipients, subject, html);

    await ActivityLog.create({
      action: "email_campaign_sent",
      description: `Email campaign sent to ${sent}/${recipients.length} ${segment} users. Subject: "${subject}"`,
      userId: session.user.id,
      userName: "Admin",
    });

    return NextResponse.json({ sent, failed, total: recipients.length });
  } catch (error: any) {
    console.error("POST /api/admin/email-campaign error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
