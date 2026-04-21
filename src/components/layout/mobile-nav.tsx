"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, MessageSquare, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface MobileNavProps {
  unreadMessages?: number;
  unreadInterests?: number;
}

export function MobileNav({ unreadMessages = 0, unreadInterests = 0 }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const TABS = [
    { href: "/dashboard", label: t.nav.home, icon: Home },
    { href: "/search", label: t.common.search, icon: Search },
    { href: "/interests", label: t.nav.interests, icon: Heart },
    { href: "/chat", label: t.nav.chat, icon: MessageSquare },
    { href: "/settings", label: t.nav.more, icon: MoreHorizontal },
  ];

  const getBadge = (href: string) => {
    if (href === "/chat" && unreadMessages > 0) return unreadMessages;
    if (href === "/interests" && unreadInterests > 0) return unreadInterests;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[300] border-t border-neutral-200 bg-white lg:hidden">
      <div className="flex h-14 items-center justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href);
          const badge = getBadge(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-[64px] transition-colors",
                isActive ? "text-primary-600" : "text-neutral-400"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-0.5 text-[9px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iPhone */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
