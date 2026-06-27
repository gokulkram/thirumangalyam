import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Subscription, Profile, ActivityLog, PromoCode } from "@/lib/db/models";
import { notifyPremiumActivated } from "@/lib/notifications/service";

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
      couponCode,
      finalAmount,
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

    // Resolve coupon discount server-side if code provided
    let discountAmount = 0;
    let validCouponCode: string | null = null;
    const originalAmount = PLAN_AMOUNTS[planId];

    if (couponCode?.trim()) {
      const coupon = await PromoCode.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
      }) as any;
      if (coupon) {
        discountAmount = coupon.discountType === "percent"
          ? Math.floor((originalAmount * coupon.discountValue) / 100)
          : Math.min(coupon.discountValue, originalAmount);
        validCouponCode = coupon.code;
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await coupon.save();
      }
    }

    const paidAmount = Math.max(0, originalAmount - discountAmount);

    await Subscription.create({
      userId,
      userName: profile?.fullName || "",
      plan: planId,
      amount: paidAmount,
      originalAmount: discountAmount > 0 ? originalAmount : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : 0,
      couponCode: validCouponCode,
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

    // Send confirmation email + SMS — fire-and-forget
    notifyPremiumActivated({
      userId,
      plan: planId,
      endDate,
      amount: paidAmount,
    }).catch(() => {});

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
