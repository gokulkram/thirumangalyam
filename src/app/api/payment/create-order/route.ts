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

const PLAN_AMOUNTS: Record<string, number> = {
  premium_3: 2999,
  premium_6: 4999,
  premium_12: 7999,
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();
    const userId = session.user.id;

    if (!planId || !PLAN_AMOUNTS[planId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const amount = PLAN_AMOUNTS[planId] * 100; // Razorpay uses paise

    const order = await getRazorpay().orders.create({
      amount,
      currency: "INR",
      receipt: `r_${userId.slice(-8)}_${Date.now().toString(36)}`,
      notes: {
        userId,
        planId,
        userName: user.phone || user.email || "",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId,
    });
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
