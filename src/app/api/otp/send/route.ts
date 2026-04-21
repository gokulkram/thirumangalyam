import { NextRequest, NextResponse } from "next/server";
import { generateAndSendOTP } from "@/lib/otp-service";

function normalizePhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const mobile = cleaned.startsWith("+91")
    ? cleaned.replace("+", "")
    : cleaned.startsWith("91")
    ? cleaned
    : `91${cleaned}`;
  return mobile.length === 12 ? mobile : null;
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const mobile = normalizePhone(phone);
    if (!mobile) {
      return NextResponse.json(
        { error: "Invalid phone number. Enter a 10-digit Indian number." },
        { status: 400 }
      );
    }

    const result = await generateAndSendOTP(mobile);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      ...(result.demoOtp && { demoOtp: result.demoOtp }),
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
