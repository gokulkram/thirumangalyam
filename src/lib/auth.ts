import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import { User as UserModel, Profile } from "@/lib/db/models";
import { authConfig } from "./auth.config";
import { recordLoginEvent } from "@/lib/security/login-alert";

function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    // Password login
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Phone or Email" },
        password: { label: "Password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.identifier || !credentials?.password) return null;

        await connectDB();

        const identifier = credentials.identifier as string;
        const password = credentials.password as string;

        const user = await UserModel.findOne({
          $or: [
            { email: identifier },
            { phone: identifier },
            { phone: `+91${identifier.replace(/[\s\-()]/g, "")}` },
          ],
        });

        if (!user) return null;

        if (user.password && user.password.startsWith("$2")) {
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;
        } else if (user.password && user.password !== password) {
          return null;
        }

        const profile = await Profile.findOne({ userId: user._id });

        // Non-blocking login event recording
        recordLoginEvent({
          userId: user._id.toString(),
          ip: getIp(request),
          userAgent: request.headers.get("user-agent") || "",
          loginMethod: "password",
        });

        return {
          id: user._id.toString(),
          name: profile?.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role,
          gender: user.gender,
          isPremium: user.isPremium,
          plan: user.plan,
          profileComplete: user.profileComplete,
        };
      },
    }),

    // OTP login
    Credentials({
      id: "otp",
      name: "OTP",
      credentials: {
        userId: { label: "User ID" },
      },
      async authorize(credentials, request) {
        if (!credentials?.userId) return null;

        await connectDB();

        const user = await UserModel.findById(credentials.userId);
        if (!user) return null;

        const profile = await Profile.findOne({ userId: user._id });

        recordLoginEvent({
          userId: user._id.toString(),
          ip: getIp(request),
          userAgent: request.headers.get("user-agent") || "",
          loginMethod: "otp",
        });

        return {
          id: user._id.toString(),
          name: profile?.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role,
          gender: user.gender,
          isPremium: user.isPremium,
          plan: user.plan,
          profileComplete: user.profileComplete,
        };
      },
    }),

    // Admin login
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: {
        email: { label: "Admin Email" },
        password: { label: "Password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        const { Admin } = await import("@/lib/db/models");
        const admin = await Admin.findOne({ email: credentials.email });
        if (!admin) return null;

        if (admin.password.startsWith("$2")) {
          const valid = await bcrypt.compare(credentials.password as string, admin.password);
          if (!valid) return null;
        } else if (admin.password !== credentials.password) {
          return null;
        }

        recordLoginEvent({
          userId: admin._id.toString(),
          ip: getIp(request),
          userAgent: request.headers.get("user-agent") || "",
          loginMethod: "admin",
        });

        return {
          id: admin._id.toString(),
          name: admin.name || "Admin",
          email: admin.email,
          role: "admin",
          isAdmin: true,
        } as any;
      },
    }),
  ],

  callbacks: {
    // Keep the session callback from authConfig unchanged
    session: authConfig.callbacks!.session as any,

    async jwt({ token, user, trigger, session }) {
      // Fresh login — populate token from user object
      if (user) {
        token.id = user.id;
        token.phone = (user as any).phone;
        token.role = (user as any).role;
        token.gender = (user as any).gender;
        token.isPremium = (user as any).isPremium;
        token.plan = (user as any).plan;
        token.profileComplete = (user as any).profileComplete;
        token.isAdmin = (user as any).isAdmin;

        // Embed sessionVersion so we can detect "logout all devices" later
        if (user.id && !(user as any).isAdmin) {
          try {
            await connectDB();
            const dbUser = await UserModel.findById(user.id).select("sessionVersion").lean();
            token.sessionVersion = (dbUser as any)?.sessionVersion ?? 0;
          } catch {}
        }
        token.svCheckedAt = Math.floor(Date.now() / 1000);
      }

      // Client-side session.update() trigger
      if (trigger === "update" && session) {
        if (session.isPremium !== undefined) token.isPremium = session.isPremium;
        if (session.plan !== undefined) token.plan = session.plan;
        if (session.profileComplete !== undefined) token.profileComplete = session.profileComplete;
      }

      // Periodic sessionVersion check — at most once per hour to limit DB reads.
      // Returns null to force re-login if the user triggered "logout all devices".
      if (token.id && !token.isAdmin && token.sessionVersion !== undefined) {
        const now = Math.floor(Date.now() / 1000);
        const lastCheck = (token.svCheckedAt as number) || 0;
        if (now - lastCheck >= 3600) {
          try {
            await connectDB();
            const dbUser = await UserModel.findById(token.id).select("sessionVersion").lean();
            if (dbUser && (dbUser as any).sessionVersion !== token.sessionVersion) {
              return null as any;
            }
            token.svCheckedAt = now;
          } catch {}
        }
      }

      return token;
    },
  },
});
