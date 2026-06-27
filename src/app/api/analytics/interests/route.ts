import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Interest, ProfileView } from "@/lib/db/models";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

    const [sent, received, totalViews] = await Promise.all([
      Interest.find({ fromUserId: userId }).select("status createdAt respondedAt").lean(),
      Interest.find({ toUserId: userId }).select("status createdAt respondedAt").lean(),
      ProfileView.countDocuments({ viewedUserId: userId }),
    ]);

    // Sent breakdown
    const sentTotal = sent.length;
    const sentAccepted = sent.filter((i: any) => i.status === "accepted").length;
    const sentDeclined = sent.filter((i: any) => i.status === "declined").length;
    const sentPending = sent.filter((i: any) => i.status === "pending").length;
    const sentWithdrawn = sent.filter((i: any) => i.status === "withdrawn").length;
    const sentAcceptRate = sentTotal > 0 ? Math.round((sentAccepted / sentTotal) * 100) : 0;

    // Received breakdown
    const recvTotal = received.length;
    const recvAccepted = received.filter((i: any) => i.status === "accepted").length;
    const recvDeclined = received.filter((i: any) => i.status === "declined").length;
    const recvPending = received.filter((i: any) => i.status === "pending").length;
    const recvResponseRate = recvTotal > 0 ? Math.round(((recvAccepted + recvDeclined) / recvTotal) * 100) : 0;

    // Avg response time for received interests (accepted+declined with respondedAt)
    const responded = received.filter((i: any) => i.respondedAt && i.createdAt) as any[];
    const avgResponseHours = responded.length > 0
      ? Math.round(responded.reduce((sum: number, i: any) => {
          const h = (new Date(i.respondedAt).getTime() - new Date(i.createdAt).getTime()) / 3600000;
          return sum + h;
        }, 0) / responded.length)
      : null;

    // View → Interest conversion rate
    const conversionRate = totalViews > 0 ? Math.round((sentTotal / totalViews) * 100) : 0;

    // Weekly trend (last 8 weeks)
    const weeks: { week: string; sent: number; received: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date(); end.setDate(end.getDate() - i * 7);
      const label = start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      weeks.push({
        week: label,
        sent: sent.filter((s: any) => new Date(s.createdAt) >= start && new Date(s.createdAt) < end).length,
        received: received.filter((r: any) => new Date(r.createdAt) >= start && new Date(r.createdAt) < end).length,
      });
    }

    return NextResponse.json({
      sent: { total: sentTotal, accepted: sentAccepted, declined: sentDeclined, pending: sentPending, withdrawn: sentWithdrawn, acceptRate: sentAcceptRate },
      received: { total: recvTotal, accepted: recvAccepted, declined: recvDeclined, pending: recvPending, responseRate: recvResponseRate },
      avgResponseHours,
      profileViews: totalViews,
      conversionRate,
      weeklyTrend: weeks,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
