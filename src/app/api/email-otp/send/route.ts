import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, EmailOtpRecord } from "@/lib/db/models";
import nodemailer from "nodemailer";
import crypto from "crypto";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

const isMailConfigured =
  !!SMTP_USER && !!SMTP_PASS && SMTP_USER !== "your_email@gmail.com";

const transporter = isMailConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    await connectDB();

    // Check if email is already used by another account
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "This email is already associated with another account" },
        { status: 409 }
      );
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await EmailOtpRecord.findOneAndUpdate(
      { userId: session.user.id },
      { email: email.toLowerCase(), otp, expiresAt, attempts: 0 },
      { upsert: true, new: true }
    );

    if (isMailConfigured && transporter) {
      await transporter.sendMail({
        from: `"Thirumangalyam" <${SMTP_USER}>`,
        to: email,
        subject: "Verify your email address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="background: #D64545; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="margin: 0;">Thirumangalyam</h2>
              <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Email Verification</p>
            </div>
            <div style="border: 1px solid #e5e5e5; border-top: none; padding: 32px; border-radius: 0 0 8px 8px;">
              <p style="color: #444; margin-top: 0;">Use the code below to verify your email address:</p>
              <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #D64545; font-family: monospace;">${otp}</span>
              </div>
              <p style="color: #888; font-size: 13px;">This code expires in <strong>10 minutes</strong>.</p>
              <p style="color: #888; font-size: 13px;">If you did not request this, please ignore this email.</p>
            </div>
          </div>
        `,
      });

      return NextResponse.json({ success: true, message: "Verification code sent to your email" });
    }

    // Demo mode — return OTP in response
    console.log(`[EMAIL OTP DEMO] To: ${email}  OTP: ${otp}`);
    return NextResponse.json({
      success: true,
      message: "OTP generated (demo mode — SMTP not configured)",
      demoOtp: otp,
    });
  } catch (error: any) {
    console.error("Email OTP send error:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
