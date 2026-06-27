import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, PromoCode } from "@/lib/db/models";

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

    const { planId, couponCode } = await req.json();
    const userId = session.user.id;

    if (!planId || !PLAN_AMOUNTS[planId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let originalAmount = PLAN_AMOUNTS[planId];
    let discountAmount = 0;
    let appliedCoupon: string | null = null;

    if (couponCode?.trim()) {
      const coupon = await PromoCode.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
      }).lean() as any;

      if (coupon && !(coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
        && !(coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
        && !(coupon.applicablePlans?.length > 0 && !coupon.applicablePlans.includes(planId))) {
        discountAmount = coupon.discountType === "percent"
          ? Math.floor((originalAmount * coupon.discountValue) / 100)
          : Math.min(coupon.discountValue, originalAmount);
        appliedCoupon = coupon.code;
      }
    }

    const finalAmount = originalAmount - discountAmount;
    const amount = Math.max(100, finalAmount) * 100; // Razorpay uses paise, minimum ₹1

    const order = await getRazorpay().orders.create({
      amount,
      currency: "INR",
      receipt: `r_${userId.slice(-8)}_${Date.now().toString(36)}`,
      notes: {
        userId,
        planId,
        userName: user.phone || user.email || "",
        couponCode: appliedCoupon || "",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId,
      originalAmount,
      discountAmount,
      finalAmount,
      couponApplied: appliedCoupon,
    });
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
