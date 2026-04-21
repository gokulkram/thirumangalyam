import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Subscription, Profile, ActivityLog } from "@/lib/db/models";

// Only available when test mode is explicitly enabled

const PLAN_AMOUNTS: Record<string, number> = {
  premium_3: 2999,
  premium_6: 4999,
  premium_12: 7999,
};

const PLAN_MONTHS: Record<string, number> = {
  premium_3: 3,
  premium_6: 6,
  premium_12: 12,
};

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE) {
    return NextResponse.json({ error: "Test mode is not enabled" }, { status: 403 });
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, paymentMethod, simulateFailure } = await req.json();
    const userId = session.user.id;

    if (!planId || !PLAN_AMOUNTS[planId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Simulate failure scenario
    if (simulateFailure) {
      return NextResponse.json(
        { error: "Payment failed", code: "PAYMENT_FAILED", description: "Simulated payment failure for testing" },
        { status: 402 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 1: Create a real Razorpay order
    const order = await getRazorpay().orders.create({
      amount: PLAN_AMOUNTS[planId] * 100,
      currency: "INR",
      receipt: `r_${userId.slice(-8)}_${Date.now().toString(36)}`,
      notes: { userId, planId, test: "true" },
    });

    // Step 2: Generate a fake payment ID and compute correct signature
    const fakePaymentId = `pay_test_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const signatureBody = order.id + "|" + fakePaymentId;
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(signatureBody)
      .digest("hex");

    // Step 3: Activate subscription in DB (same logic as verify route)
    const months = PLAN_MONTHS[planId] || 3;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const profile = await Profile.findOne({ userId });

    await Subscription.create({
      userId,
      userName: profile?.fullName || "",
      plan: planId,
      amount: PLAN_AMOUNTS[planId],
      startDate,
      endDate,
      status: "active",
      paymentMethod: paymentMethod || "Test",
      razorpayOrderId: order.id,
      razorpayPaymentId: fakePaymentId,
    });

    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      plan: planId,
    });

    await ActivityLog.create({
      action: "subscription_activated",
      description: `[TEST] ${profile?.fullName || "User"} subscribed to ${planId} via ${paymentMethod}`,
      userId,
      userName: profile?.fullName || "",
    });

    return NextResponse.json({
      success: true,
      test: true,
      orderId: order.id,
      paymentId: fakePaymentId,
      signature,
      subscription: {
        plan: planId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Test pay error:", error);
    return NextResponse.json(
      { error: error.message || "Test payment failed" },
      { status: 500 }
    );
  }
}
