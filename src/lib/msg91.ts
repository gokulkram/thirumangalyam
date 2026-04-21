const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || "";

const BASE_URL = "https://control.msg91.com/api/v5";

export const isDemoMode =
  !MSG91_AUTH_KEY || MSG91_AUTH_KEY === "your_msg91_auth_key";

/**
 * Send OTP via MSG91. Pass `otp` so MSG91 uses our generated code in the SMS template.
 * Phone must include country code, e.g. "919876543210"
 */
export async function sendOTP(
  phone: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  if (isDemoMode) {
    console.log(`[DEMO OTP] Phone: ${phone}  OTP: ${otp}`);
    return { success: true, message: "OTP sent (demo mode)" };
  }

  const url =
    `${BASE_URL}/otp` +
    `?template_id=${MSG91_TEMPLATE_ID}` +
    `&mobile=${phone}` +
    `&authkey=${MSG91_AUTH_KEY}` +
    `&otp=${otp}`;

  const res = await fetch(url, { method: "POST" });
  const data = await res.json();

  if (data.type === "success") {
    return { success: true, message: "OTP sent successfully" };
  }

  return { success: false, message: data.message || "Failed to send OTP" };
}

/**
 * Resend OTP via MSG91 (retrytype: "text" | "voice").
 * In our DB-first model we regenerate, so this is only called for voice retry.
 */
export async function resendOTP(
  phone: string,
  otp: string,
  retryType: "text" | "voice" = "text"
): Promise<{ success: boolean; message: string }> {
  if (isDemoMode) {
    console.log(`[DEMO OTP] Resend — Phone: ${phone}  OTP: ${otp}`);
    return { success: true, message: "OTP resent (demo mode)" };
  }

  const url =
    `${BASE_URL}/otp/retry` +
    `?mobile=${phone}` +
    `&retrytype=${retryType}` +
    `&authkey=${MSG91_AUTH_KEY}`;

  const res = await fetch(url, { method: "POST" });
  const data = await res.json();

  if (data.type === "success") {
    return { success: true, message: "OTP resent" };
  }

  return { success: false, message: data.message || "Failed to resend OTP" };
}
