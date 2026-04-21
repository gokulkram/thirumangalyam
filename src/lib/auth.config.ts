import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [], // Providers added in auth.ts (they need Node.js runtime)

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as any).phone;
        token.role = (user as any).role;
        token.gender = (user as any).gender;
        token.isPremium = (user as any).isPremium;
        token.plan = (user as any).plan;
        token.profileComplete = (user as any).profileComplete;
        token.isAdmin = (user as any).isAdmin;
      }
      // Called when useSession().update() is triggered client-side
      if (trigger === "update" && session) {
        if (session.isPremium !== undefined) token.isPremium = session.isPremium;
        if (session.plan !== undefined) token.plan = session.plan;
        if (session.profileComplete !== undefined) token.profileComplete = session.profileComplete;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).phone = token.phone;
        (session.user as any).role = token.role;
        (session.user as any).gender = token.gender;
        (session.user as any).isPremium = token.isPremium;
        (session.user as any).plan = token.plan;
        (session.user as any).profileComplete = token.profileComplete;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      return true; // Authorization logic is handled in middleware.ts
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
