import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

const isConfigured = SMTP_USER && SMTP_PASS && SMTP_USER !== "your_email@gmail.com";

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

interface UserDetails {
  fullName: string;
  phone: string;
  email: string;
  role: string;
  gender: string;
  community?: string;
  subCommunity?: string;
}

/**
 * Send admin notification on new user registration.
 */
export async function notifyAdminNewRegistration(user: UserDetails) {
  const subject = `🆕 New Registration: ${user.fullName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #D64545; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Thirumangalyam — New Registration</h2>
      </div>
      <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; margin-top: 0;">A new user has registered on the platform.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #888; width: 140px;">Full Name</td><td style="padding: 8px 0; font-weight: 600;">${user.fullName}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Phone</td><td style="padding: 8px 0; font-weight: 600;">${user.phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; font-weight: 600;">${user.email || "—"}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Gender</td><td style="padding: 8px 0; font-weight: 600;">${user.gender}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Role</td><td style="padding: 8px 0; font-weight: 600;">${user.role}</td></tr>
          ${user.community ? `<tr><td style="padding: 8px 0; color: #888;">Community</td><td style="padding: 8px 0; font-weight: 600;">${user.community}</td></tr>` : ""}
          ${user.subCommunity ? `<tr><td style="padding: 8px 0; color: #888;">Sub-Community</td><td style="padding: 8px 0; font-weight: 600;">${user.subCommunity}</td></tr>` : ""}
          <tr><td style="padding: 8px 0; color: #888;">Registered At</td><td style="padding: 8px 0; font-weight: 600;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>
        </table>
        <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/users" style="display: inline-block; background: #D64545; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">View in Admin Panel</a>
      </div>
    </div>
  `;

  await sendAdminEmail(subject, html);
}

/**
 * Send admin notification on user login.
 */
export async function notifyAdminLogin(user: { fullName: string; phone: string; email: string }) {
  const subject = `🔑 User Login: ${user.fullName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Thirumangalyam — User Login</h2>
      </div>
      <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; margin-top: 0;">A user has logged in to the platform.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #888; width: 140px;">Full Name</td><td style="padding: 8px 0; font-weight: 600;">${user.fullName}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Phone</td><td style="padding: 8px 0; font-weight: 600;">${user.phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; font-weight: 600;">${user.email || "—"}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Login Time</td><td style="padding: 8px 0; font-weight: 600;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>
        </table>
      </div>
    </div>
  `;

  await sendAdminEmail(subject, html);
}

/**
 * Core email sender — logs to console if SMTP is not configured.
 */
async function sendAdminEmail(subject: string, html: string) {
  if (!transporter || !ADMIN_EMAIL) {
    console.log(`[MAIL - DEMO MODE] To: ${ADMIN_EMAIL || "not set"}`);
    console.log(`[MAIL - DEMO MODE] Subject: ${subject}`);
    console.log(`[MAIL - DEMO MODE] SMTP not configured. Set SMTP_USER & SMTP_PASS in .env.local to enable.`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Thirumangalyam" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject,
      html,
    });
    console.log(`[MAIL] Sent to ${ADMIN_EMAIL}: ${subject}`);
  } catch (err) {
    console.error("[MAIL] Failed to send admin email:", err);
  }
}
