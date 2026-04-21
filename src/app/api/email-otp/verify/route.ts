import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, EmailOtpRecord } from "@/lib/db/models";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { otp } = await req.json();
    if (!otp || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
    }

    await connectDB();

    const record = await EmailOtpRecord.findOne({ userId: session.user.id });

    if (!record) {
      return NextResponse.json(
        { error: "No verification pending. Please request a new code." },
        { status: 400 }
      );
    }

    if (new Date() > record.expiresAt) {
      await EmailOtpRecord.deleteOne({ userId: session.user.id });
      return NextResponse.json(
        { error: "Code expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await EmailOtpRecord.deleteOne({ userId: session.user.id });
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new code." },
        { status: 400 }
      );
    }

    if (record.otp !== otp) {
      await EmailOtpRecord.updateOne(
        { userId: session.user.id },
        { $inc: { attempts: 1 } }
      );
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return NextResponse.json(
        {
          error: `Invalid code. ${remaining > 0 ? `${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` : "Please request a new code."}`,
        },
        { status: 400 }
      );
    }

    // Valid — update user email
    await User.findByIdAndUpdate(session.user.id, { email: record.email });
    await EmailOtpRecord.deleteOne({ userId: session.user.id });

    return NextResponse.json({
      success: true,
      message: "Email verified and updated successfully",
      email: record.email,
    });
  } catch (error: any) {
    console.error("Email OTP verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
