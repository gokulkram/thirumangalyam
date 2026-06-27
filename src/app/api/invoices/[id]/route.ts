import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Subscription, Profile } from "@/lib/db/models";

const PLAN_LABELS: Record<string, string> = {
  premium_3: "Premium Plan — 3 Months",
  premium_6: "Premium Plan — 6 Months",
  premium_12: "Premium Plan — 12 Months",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const sub = await Subscription.findOne({ _id: id, userId: session.user.id }).lean() as any;
    if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const profile = await Profile.findOne({ userId: session.user.id }).select("fullName").lean() as any;
    const name = profile?.fullName || "Member";
    const invoiceNo = `TM-${sub._id.toString().slice(-8).toUpperCase()}`;

    const fmt = (d: Date | string) =>
      new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const divider = "─".repeat(48);
    const receipt = [
      "THIRUMANGALYAM — PAYMENT RECEIPT",
      "=".repeat(48),
      "",
      `Invoice No  : ${invoiceNo}`,
      `Date        : ${fmt(sub.createdAt)}`,
      `Customer    : ${name}`,
      "",
      divider,
      `Description : ${PLAN_LABELS[sub.plan] || sub.plan}`,
      `Plan Period : ${fmt(sub.startDate)}  →  ${fmt(sub.endDate)}`,
      `Payment Via : ${sub.paymentMethod || "Razorpay"}`,
      `Status      : ${sub.status.toUpperCase()}`,
      divider,
      "",
      sub.discountAmount > 0
        ? `Original    : INR ${(sub.originalAmount || sub.amount)?.toLocaleString("en-IN")}`
        : null,
      sub.discountAmount > 0
        ? `Discount    : − INR ${sub.discountAmount?.toLocaleString("en-IN")}${sub.couponCode ? ` (${sub.couponCode})` : ""}`
        : null,
      `TOTAL PAID  : INR ${sub.amount?.toLocaleString("en-IN")}`,
      "",
      sub.razorpayOrderId ? `Order ID    : ${sub.razorpayOrderId}` : null,
      sub.razorpayPaymentId ? `Payment ID  : ${sub.razorpayPaymentId}` : null,
      "",
      "=".repeat(48),
      "Thank you for choosing Thirumangalyam Premium.",
      "For support: support@thirumangalyam.com",
      "=".repeat(48),
    ]
      .filter((l) => l !== null)
      .join("\n");

    return new NextResponse(receipt, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="receipt-${invoiceNo}.txt"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
