"use client";

import { useSession } from "next-auth/react";
import { AppHeader, Sidebar, MobileNav, MinimalFooter } from "@/components/layout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  const user = session?.user
    ? {
        name: session.user.name || "User",
        isPremium: (session.user as any).isPremium ?? false,
      }
    : { name: "User", isPremium: false };

  const isPremium = (session?.user as any)?.isPremium ?? false;
  const profileComplete = (session?.user as any)?.profileComplete ?? 0;

  return (
    <div className="flex min-h-dvh flex-col bg-bg-secondary">
      <AppHeader
        user={user}
        unreadMessages={0}
        unreadNotifications={0}
      />

      <div className="flex flex-1">
        <Sidebar profileCompletion={profileComplete} isPremium={isPremium} />

        <main id="main-content" className="flex-1 min-w-0">
          <div className="mx-auto max-w-[1120px] px-4 py-6 md:px-6 lg:px-8 pb-20 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      <MobileNav unreadMessages={0} unreadInterests={0} />
    </div>
  );
}
