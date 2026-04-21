import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Subscription } from "@/lib/db/models";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;

    // Auto-expire subscriptions whose endDate has passed
    await Subscription.updateMany(
      { userId, status: "active", endDate: { $lt: new Date() } },
      { status: "expired" }
    );

    const active = await Subscription.findOne({ userId, status: "active" })
      .sort({ createdAt: -1 })
      .lean();

    const history = await Subscription.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ active, history });
  } catch (error: any) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
