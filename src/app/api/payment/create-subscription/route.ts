import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

const PLAN_IDS: Record<string, string> = {
  premium_3: process.env.RAZORPAY_PLAN_ID_3M || "",
  premium_6: process.env.RAZORPAY_PLAN_ID_6M || "",
  premium_12: process.env.RAZORPAY_PLAN_ID_12M || "",
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();
    const userId = session.user.id;

    if (!planId || !PLAN_IDS[planId]) {
      return NextResponse.json(
        { error: "Invalid plan or Razorpay plan not configured" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscription = await getRazorpay().subscriptions.create({
      plan_id: PLAN_IDS[planId],
      total_count: 1,
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId,
        planId,
        userPhone: user.phone || "",
        userEmail: user.email || "",
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      planId,
    });
  } catch (error: any) {
    console.error("Create subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create subscription" },
      { status: 500 }
    );
  }
}
