"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { AppHeader, Sidebar, MobileNav, MinimalFooter } from "@/components/layout";

interface NavCounts {
  pendingReceived: number;
  pendingSent: number;
  shortlistCount: number;
  viewedMeCount: number;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [navCounts, setNavCounts] = useState<NavCounts>({
    pendingReceived: 0,
    pendingSent: 0,
    shortlistCount: 0,
    viewedMeCount: 0,
  });
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/nav-counts")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setNavCounts(data);
          setUnreadMessages(data.unreadMessages || 0);
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

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
        unreadMessages={unreadMessages}
        unreadNotifications={navCounts.pendingReceived}
        navCounts={navCounts}
      />

      <div className="flex flex-1">
        <Sidebar
          profileCompletion={profileComplete}
          isPremium={isPremium}
          navCounts={navCounts}
        />

        <main id="main-content" className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 mx-auto w-full max-w-[1120px] px-3 pt-4 pb-24 sm:px-4 sm:pt-6 sm:pb-24 md:px-6 lg:px-8 lg:pt-6 lg:pb-8">
            {children}
          </div>
          {/* Footer — desktop only; mobile uses the bottom nav bar */}
          <MinimalFooter className="hidden lg:flex" />
        </main>
      </div>

      <MobileNav unreadMessages={unreadMessages} unreadInterests={navCounts.pendingReceived} />
    </div>
  );
}
