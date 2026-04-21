import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Subscription, Profile, ActivityLog } from "@/lib/db/models";

const PLAN_MONTHS: Record<string, number> = {
  premium_3: 3,
  premium_6: 6,
  premium_12: 12,
};

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

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      paymentMethod,
    } = await req.json();
    const userId = session.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    await connectDB();

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
      paymentMethod: paymentMethod || "Razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      plan: planId,
    });

    await ActivityLog.create({
      action: "subscription_activated",
      description: `${profile?.fullName || "User"} subscribed to ${planId} plan`,
      userId,
      userName: profile?.fullName || "",
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: {
        plan: planId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
