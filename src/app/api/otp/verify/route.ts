import { NextRequest, NextResponse } from "next/server";
import { verifyStoredOTP } from "@/lib/otp-service";
import { connectDB } from "@/lib/db/connection";
import { User, Profile, ActivityLog } from "@/lib/db/models";
import { notifyAdminNewRegistration, notifyAdminLogin } from "@/lib/mailer";
import { notifyWelcome } from "@/lib/notifications/service";

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, context, userData } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone and OTP are required" },
        { status: 400 }
      );
    }

    // Normalize phone
    const cleaned = phone.replace(/[\s\-()]/g, "");
    const mobile = cleaned.startsWith("+91")
      ? cleaned.replace("+", "")
      : cleaned.startsWith("91")
      ? cleaned
      : `91${cleaned}`;

    const result = await verifyStoredOTP(mobile, otp);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    await connectDB();

    // Registration flow — create user
    if (context === "register" && userData) {
      const existingUser = await User.findOne({ phone: `+${mobile}` });
      if (existingUser) {
        return NextResponse.json(
          { error: "Phone number already registered" },
          { status: 409 }
        );
      }

      const roleMap: Record<string, string> = {
        myself: "individual",
        child: "parent",
        sibling: "guardian",
      };

      const user = await User.create({
        phone: `+${mobile}`,
        email: userData.email || "",
        role: roleMap[userData.role] || "individual",
        gender: userData.gender || "male",
        status: "active",
        profileComplete: 0,
      });

      // Create blank profile
      await Profile.create({
        userId: user._id,
        fullName: userData.fullName || "",
        community: userData.community || "",
        subCaste: userData.subCommunity || "",
      });

      await ActivityLog.create({
        action: "user_registered",
        description: `${userData.fullName || "User"} registered via OTP`,
        userId: user._id,
        userName: userData.fullName || "",
      });

      // Notify admin (non-blocking)
      notifyAdminNewRegistration({
        fullName: userData.fullName || "",
        phone: `+${mobile}`,
        email: userData.email || "",
        role: roleMap[userData.role] || "individual",
        gender: userData.gender || "male",
        community: userData.community || "",
        subCommunity: userData.subCommunity || "",
      }).catch(() => {});

      // Welcome email + SMS to new user (non-blocking)
      notifyWelcome({
        userId: user._id.toString(),
        fullName: userData.fullName || "",
        email: userData.email || "",
        phone: `+${mobile}`,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "OTP verified, account created",
        userId: user._id.toString(),
      });
    }

    // Login flow — find existing user
    if (context === "login") {
      const user = await User.findOne({ phone: `+${mobile}` });
      if (!user) {
        return NextResponse.json(
          { error: "No account found with this number. Please register first." },
          { status: 404 }
        );
      }

      // Get profile name for email
      const loginProfile = await Profile.findOne({ userId: user._id }).select("fullName").lean();

      // Send admin email notification (non-blocking)
      notifyAdminLogin({
        fullName: (loginProfile as any)?.fullName || "User",
        phone: `+${mobile}`,
        email: user.email || "",
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "OTP verified, logged in",
        userId: user._id.toString(),
      });
    }

    // Generic OTP verification (password reset, etc.)
    return NextResponse.json({ success: true, message: "OTP verified" });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
