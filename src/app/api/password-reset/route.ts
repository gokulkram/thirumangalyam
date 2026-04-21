import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyOTP } from "@/lib/msg91";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";

/**
 * POST /api/password-reset
 *
 * Step 1 — Send OTP:  { phone, action: "send" }
 * Step 2 — Verify & Reset:  { phone, otp, newPassword, action: "reset" }
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, otp, newPassword, action } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Normalize phone
    const cleaned = phone.replace(/[\s\-()]/g, "");
    const mobile = cleaned.startsWith("+91")
      ? cleaned.replace("+", "")
      : cleaned.startsWith("91")
      ? cleaned
      : `91${cleaned}`;

    if (mobile.length !== 12) {
      return NextResponse.json(
        { error: "Invalid phone number. Use 10-digit Indian number." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const user = await User.findOne({ phone: `+${mobile}` });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this phone number." },
        { status: 404 }
      );
    }

    // Step 1: Send OTP for password reset
    if (action === "send") {
      const { sendOTP } = await import("@/lib/msg91");
      const result = await sendOTP(mobile);

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "OTP sent to your registered phone number.",
      });
    }

    // Step 2: Verify OTP and reset password
    if (action === "reset") {
      if (!otp || !newPassword) {
        return NextResponse.json(
          { error: "OTP and new password are required" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Verify OTP
      const result = await verifyOTP(mobile, otp);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await User.findByIdAndUpdate(user._id, { password: hashedPassword });

      return NextResponse.json({
        success: true,
        message: "Password reset successfully. You can now login with your new password.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: error.message || "Password reset failed" },
      { status: 500 }
    );
  }
}
