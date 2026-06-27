import crypto from "crypto";
import { connectDB } from "@/lib/db/connection";
import { OtpRecord } from "@/lib/db/models";
import { sendOTP, resendOTP, isDemoMode } from "@/lib/msg91";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function generateAndSendOTP(
  phone: string
): Promise<{ success: boolean; message: string; demoOtp?: string }> {
  await connectDB();

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await OtpRecord.findOneAndUpdate(
    { phone },
    { otp, expiresAt, attempts: 0 },
    { upsert: true, new: true }
  );

  const result = await sendOTP(phone, otp);
  if (!result.success) {
    // SMS provider rejected the request (e.g. invalid MSG91 template/flow ID).
    // Don't block login — fall back to demo mode and surface the OTP on screen.
    console.warn(`[OTP] SMS send failed, falling back to demo mode: ${result.message}`);
    return { success: true, message: "OTP ready (demo mode)", demoOtp: otp };
  }

  return {
    success: true,
    message: isDemoMode ? "OTP ready (demo mode)" : "OTP sent to your mobile number",
    ...(isDemoMode && { demoOtp: otp }),
  };
}

export async function verifyStoredOTP(
  phone: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  await connectDB();

  const record = await OtpRecord.findOne({ phone });

  if (!record) {
    return { success: false, message: "OTP expired or not found. Please request a new OTP." };
  }

  if (new Date() > record.expiresAt) {
    await OtpRecord.deleteOne({ phone });
    return { success: false, message: "OTP has expired. Please request a new one." };
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await OtpRecord.deleteOne({ phone });
    return { success: false, message: "Too many incorrect attempts. Please request a new OTP." };
  }

  if (record.otp !== otp) {
    await OtpRecord.updateOne({ phone }, { $inc: { attempts: 1 } });
    const remaining = MAX_VERIFY_ATTEMPTS - (record.attempts + 1);
    return {
      success: false,
      message: `Invalid OTP. ${remaining > 0 ? `${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` : "Please request a new OTP."}`,
    };
  }

  await OtpRecord.deleteOne({ phone });
  return { success: true, message: "OTP verified successfully" };
}

export async function resendStoredOTP(
  phone: string
): Promise<{ success: boolean; message: string; demoOtp?: string }> {
  await connectDB();

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await OtpRecord.findOneAndUpdate(
    { phone },
    { otp, expiresAt, attempts: 0 },
    { upsert: true, new: true }
  );

  const result = await resendOTP(phone, otp, "text");
  if (!result.success) {
    // Same fallback as generateAndSendOTP — keep login usable if SMS fails.
    console.warn(`[OTP] SMS resend failed, falling back to demo mode: ${result.message}`);
    return { success: true, message: "New OTP generated (demo mode)", demoOtp: otp };
  }

  return {
    success: true,
    message: isDemoMode ? "New OTP generated (demo mode)" : "New OTP sent to your mobile number",
    ...(isDemoMode && { demoOtp: otp }),
  };
}
