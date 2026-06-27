import { connectDB } from "@/lib/db/connection";
import { User, Profile, LoginEvent } from "@/lib/db/models";

export function parseDevice(userAgent: string): string {
  if (!userAgent) return "Unknown device";
  if (/iPhone|iPad/.test(userAgent)) return "iPhone/iPad";
  if (/Android/.test(userAgent)) return "Android device";
  if (/Windows/.test(userAgent)) return "Windows PC";
  if (/Macintosh|Mac OS/.test(userAgent)) return "Mac";
  if (/Linux/.test(userAgent)) return "Linux PC";
  return "Unknown device";
}

export async function recordLoginEvent(params: {
  userId: string;
  ip: string;
  userAgent: string;
  loginMethod: "password" | "otp" | "admin";
}): Promise<void> {
  try {
    await connectDB();

    // Check if this ip+userAgent combo was seen in the last 30 days
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEvent = await LoginEvent.findOne({
      userId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
      createdAt: { $gte: cutoff },
    }).lean();

    const isNewDevice = !recentEvent;

    await LoginEvent.create({
      userId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
      loginMethod: params.loginMethod,
      isNewDevice,
    });

    if (isNewDevice) {
      const [user, profile] = await Promise.all([
        User.findById(params.userId).select("email").lean(),
        Profile.findOne({ userId: params.userId }).select("fullName").lean(),
      ]);

      const email = (user as any)?.email;
      if (email) {
        const { sendLoginAlertEmail } = await import("@/lib/mailer");
        await sendLoginAlertEmail({
          email,
          fullName: (profile as any)?.fullName || "User",
          ip: params.ip,
          device: parseDevice(params.userAgent),
          time: new Date(),
          loginMethod: params.loginMethod,
        });
      }
    }
  } catch (err) {
    console.error("[Security] recordLoginEvent error:", err);
  }
}
