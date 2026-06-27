import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateAndSendOTP, verifyStoredOTP } from "@/lib/otp-service";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";

/**
 * POST /api/password-reset
 *
 * Step 1 — Send OTP:    { phone, action: "send" }
 * Step 2 — Verify & Reset: { phone, otp, newPassword, action: "reset" }
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, otp, newPassword, action } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Normalize phone to 91XXXXXXXXXX
    const cleaned = phone.replace(/[\s\-()]/g, "");
    const mobile = cleaned.startsWith("+91")
      ? cleaned.slice(1)
      : cleaned.startsWith("91") && cleaned.length === 12
      ? cleaned
      : `91${cleaned}`;

    if (mobile.length !== 12) {
      return NextResponse.json(
        { error: "Invalid phone number. Use a 10-digit Indian number." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ phone: `+${mobile}` });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this phone number." },
        { status: 404 }
      );
    }

    // Step 1: Generate OTP and send via otp-service (same as normal OTP flow)
    if (action === "send") {
      const result = await generateAndSendOTP(mobile);

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "OTP sent to your registered phone number.",
        // Visible in demo mode so the user can complete the flow during testing
        ...(result.demoOtp && { demoOtp: result.demoOtp }),
      });
    }

    // Step 2: Verify OTP then update password
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

      const result = await verifyStoredOTP(mobile, otp);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

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
