import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Subscription, ActivityLog, Profile } from "@/lib/db/models";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subscriptionId, reason } = await req.json();
    await connectDB();

    const sub = await Subscription.findOne({
      _id: subscriptionId,
      userId: session.user.id,
      status: "active",
    });

    if (!sub) return NextResponse.json({ error: "Active subscription not found" }, { status: 404 });

    sub.status = "cancelled";
    await sub.save();

    await User.findByIdAndUpdate(session.user.id, { isPremium: false, plan: "free" });

    const profile = await Profile.findOne({ userId: session.user.id }).select("fullName").lean() as any;
    await ActivityLog.create({
      action: "subscription_cancelled",
      description: `${profile?.fullName || "User"} cancelled their subscription. Reason: ${reason?.trim() || "Not specified"}`,
      userId: session.user.id,
      userName: profile?.fullName || "",
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
