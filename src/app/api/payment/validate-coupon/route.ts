import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { PromoCode } from "@/lib/db/models";

const PLAN_AMOUNTS: Record<string, number> = {
  premium_3: 2999,
  premium_6: 4999,
  premium_12: 7999,
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code, planId } = await req.json();
    if (!code?.trim() || !planId)
      return NextResponse.json({ valid: false, message: "Coupon code and plan are required" });

    await connectDB();

    const coupon = await PromoCode.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    }).lean() as any;

    if (!coupon) return NextResponse.json({ valid: false, message: "Invalid coupon code" });

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
      return NextResponse.json({ valid: false, message: "This coupon has expired" });

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      return NextResponse.json({ valid: false, message: "This coupon has reached its usage limit" });

    if (coupon.applicablePlans?.length > 0 && !coupon.applicablePlans.includes(planId))
      return NextResponse.json({ valid: false, message: "This coupon is not valid for the selected plan" });

    const originalAmount = PLAN_AMOUNTS[planId] || 0;
    const discountAmount =
      coupon.discountType === "percent"
        ? Math.floor((originalAmount * coupon.discountValue) / 100)
        : Math.min(coupon.discountValue, originalAmount);
    const finalAmount = originalAmount - discountAmount;

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      originalAmount,
      finalAmount,
      message: coupon.description
        || `${coupon.discountType === "percent" ? coupon.discountValue + "%" : "₹" + coupon.discountValue} discount applied!`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
