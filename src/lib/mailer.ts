import nodemailer from "nodemailer";
import { APP_NAME } from "@/lib/constants";

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
        <h2 style="margin: 0;">${APP_NAME} — New Registration</h2>
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
        <h2 style="margin: 0;">${APP_NAME} — User Login</h2>
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
 * Send an email to a list of recipients (used for admin campaigns).
 * Returns counts of sent and failed messages.
 */
export async function sendEmailToRecipients(
  recipients: { email: string; name: string }[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: number }> {
  if (!transporter) {
    console.log(`[MAIL - DEMO MODE] Campaign: "${subject}" → ${recipients.length} recipients (SMTP not configured)`);
    return { sent: 0, failed: recipients.length };
  }

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    try {
      await transporter.sendMail({
        from: `"${APP_NAME}" <${SMTP_USER}>`,
        to: `"${r.name}" <${r.email}>`,
        subject,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`[MAIL] Failed to send to ${r.email}:`, err);
      failed++;
    }
  }
  return { sent, failed };
}

/**
 * Send a suspicious-login alert directly to the user.
 */
export async function sendLoginAlertEmail(params: {
  email: string;
  fullName: string;
  ip: string;
  device: string;
  time: Date;
  loginMethod: string;
}) {
  const timeStr = params.time.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const subject = `⚠️ New login to your ${APP_NAME} account`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #b45309; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Security Alert — ${APP_NAME}</h2>
      </div>
      <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 15px; margin-top: 0;">Hi ${params.fullName},</p>
        <p style="color: #333;">We detected a new login to your account from a device we haven't seen before.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #fef9ee; border-radius: 8px;">
          <tr><td style="padding: 10px 16px; color: #888; width: 130px;">Device</td><td style="padding: 10px 16px; font-weight: 600;">${params.device}</td></tr>
          <tr><td style="padding: 10px 16px; color: #888;">IP Address</td><td style="padding: 10px 16px; font-weight: 600;">${params.ip}</td></tr>
          <tr><td style="padding: 10px 16px; color: #888;">Method</td><td style="padding: 10px 16px; font-weight: 600; text-transform: capitalize;">${params.loginMethod}</td></tr>
          <tr><td style="padding: 10px 16px; color: #888;">Time (IST)</td><td style="padding: 10px 16px; font-weight: 600;">${timeStr}</td></tr>
        </table>
        <p style="color: #555;">If this was you, no action is needed.</p>
        <p style="color: #c00; font-weight: 600;">If this wasn't you, change your password immediately and log out all devices from your Security settings.</p>
        <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/settings" style="display: inline-block; background: #D64545; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">Secure My Account</a>
      </div>
    </div>
  `;
  await sendUserEmail(params.email, subject, html);
}

/**
 * Notify admin when a report is escalated.
 */
export async function sendEscalationAlertEmail(params: {
  reportId: string;
  reportedUserName: string;
  reason: string;
  severity: string;
  reportCount: number;
  autoEscalated: boolean;
}) {
  const subject = `🚨 Report Escalated [${params.severity.toUpperCase()}]: ${params.reportedUserName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #991b1b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">${APP_NAME} — Report Escalated</h2>
      </div>
      <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 15px; margin-top: 0;">A report has been escalated and requires immediate review.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #fff5f5; border-radius: 8px;">
          <tr><td style="padding: 10px 16px; color: #888; width: 140px;">Reported User</td><td style="padding: 10px 16px; font-weight: 600;">${params.reportedUserName}</td></tr>
          <tr><td style="padding: 10px 16px; color: #888;">Reason</td><td style="padding: 10px 16px; font-weight: 600; text-transform: capitalize;">${params.reason.replace(/_/g, " ")}</td></tr>
          <tr><td style="padding: 10px 16px; color: #888;">Severity</td><td style="padding: 10px 16px; font-weight: 700; color: #c00; text-transform: uppercase;">${params.severity}</td></tr>
          <tr><td style="padding: 10px 16px; color: #888;">Total Reports</td><td style="padding: 10px 16px; font-weight: 600;">${params.reportCount}</td></tr>
          <tr><td style="padding: 10px 16px; color: #888;">Trigger</td><td style="padding: 10px 16px;">${params.autoEscalated ? "Auto-escalated by system" : "Manually escalated by admin"}</td></tr>
        </table>
        <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/reports" style="display: inline-block; background: #991b1b; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">Review Report</a>
      </div>
    </div>
  `;
  await sendAdminEmail(subject, html);
}

/**
 * Send an email directly to a user (non-admin).
 */
export async function sendUserEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    console.log(`[MAIL - DEMO MODE] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[MAIL] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("[MAIL] Failed to send user email:", err);
  }
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
      from: `"${APP_NAME}" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject,
      html,
    });
    console.log(`[MAIL] Sent to ${ADMIN_EMAIL}: ${subject}`);
  } catch (err) {
    console.error("[MAIL] Failed to send admin email:", err);
  }
}
