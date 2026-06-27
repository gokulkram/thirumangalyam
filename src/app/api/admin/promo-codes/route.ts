import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { PromoCode } from "@/lib/db/models";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !(session.user as any).isAdmin) return null;
  return session;
}

export async function GET() {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const codes = await PromoCode.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ codes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { code, discountType, discountValue, maxUses, expiresAt, applicablePlans, description } = await req.json();
    if (!code?.trim() || !discountType || !discountValue)
      return NextResponse.json({ error: "code, discountType, and discountValue are required" }, { status: 400 });
    await connectDB();
    const exists = await PromoCode.findOne({ code: code.trim().toUpperCase() });
    if (exists) return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    const promo = await PromoCode.create({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt || null,
      applicablePlans: applicablePlans || [],
      description: description?.trim() || "",
      isActive: true,
    });
    return NextResponse.json({ code: promo }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, isActive } = await req.json();
    await connectDB();
    await PromoCode.findByIdAndUpdate(id, { isActive });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    await connectDB();
    await PromoCode.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
