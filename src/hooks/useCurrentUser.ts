"use client";

import { useSession } from "next-auth/react";

export function useCurrentUser() {
  const { data: session, status, update } = useSession();

  const user = session?.user;
  const ext = user as any;

  return {
    user,
    status,
    update,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    userId: user?.id || "",
    name: user?.name || "",
    email: user?.email || "",
    phone: ext?.phone || "",
    role: ext?.role || "individual",
    gender: ext?.gender || "male",
    isPremium: ext?.isPremium ?? false,
    plan: ext?.plan || "free",
    profileComplete: ext?.profileComplete ?? 0,
    isAdmin: ext?.isAdmin ?? false,
  };
}
