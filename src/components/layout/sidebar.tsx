"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle,
  Inbox,
  Send,
  Handshake,
  Bookmark,
  Eye,
  Star,
  Settings,
  Crown,
  Receipt,
  LifeBuoy,
  BarChart3,
  MessageSquare,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

interface NavCounts {
  pendingReceived: number;
  pendingSent: number;
  shortlistCount: number;
  viewedMeCount: number;
}

interface SidebarProps {
  profileCompletion?: number;
  isPremium?: boolean;
  navCounts?: NavCounts;
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense>
      <SidebarInner {...props} />
    </Suspense>
  );
}

function SidebarInner({
  profileCompletion = 75,
  isPremium = false,
  navCounts = { pendingReceived: 0, pendingSent: 0, shortlistCount: 0, viewedMeCount: 0 },
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const SIDEBAR_LINKS = [
    { href: "/dashboard",   label: t.nav.myMatches,  icon: LayoutDashboard },
    { href: "/search",      label: t.common.search,  icon: Search },
    { href: "/chat",        label: t.nav.messages,   icon: MessageSquare },
    { href: "/profile/me",  label: t.nav.myProfile,  icon: UserCircle },
    { section: t.nav.interests },
    { href: "/interests?tab=received", label: t.nav.received, icon: Inbox,     badge: navCounts.pendingReceived },
    { href: "/interests?tab=sent",     label: t.nav.sent,     icon: Send,      badge: navCounts.pendingSent },
    { href: "/interests?tab=accepted", label: t.nav.accepted, icon: Handshake },
    { section: t.nav.more },
    { href: "/shortlist",     label: t.nav.shortlist, icon: Bookmark, badge: navCounts.shortlistCount },
    { href: "/who-viewed-me", label: t.nav.viewedMe,  icon: Eye,      badge: navCounts.viewedMeCount },
    { section: t.nav.account },
    { href: "/analytics",    label: "My Analytics", icon: BarChart3 },
    { href: "/subscription", label: "Membership",   icon: Receipt },
    { href: "/support",      label: "Support",      icon: LifeBuoy },
    { href: "/settings",     label: t.nav.settings, icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 border-r border-neutral-200 bg-white h-[calc(100dvh-56px)] sm:h-[calc(100dvh-64px)] sticky top-14 sm:top-16 overflow-y-auto">
      {/* Profile Completion */}
      <div className="p-4 border-b border-neutral-200">
        <Link href="/profile/me" className="block hover:opacity-80 transition-opacity">
          <Progress
            value={profileCompletion}
            label="Profile"
            showPercentage
            size="sm"
          />
          {profileCompletion < 100 && (
            <p className="mt-1 text-[11px] text-primary-600 font-medium">{t.nav.completeProfile} →</p>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {SIDEBAR_LINKS.map((item, i) => {
          if ("section" in item) {
            return (
              <div
                key={i}
                className="mt-4 mb-1 px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.08em]"
              >
                {item.section}
              </div>
            );
          }

          const Icon = item.icon;
          const [linkPath, linkQuery] = item.href.split("?");
          const isActive = linkQuery
            ? pathname === linkPath && searchParams.toString() === linkQuery
            : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    isActive
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-200 text-neutral-600"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Premium upsell */}
      {!isPremium && (
        <div className="p-4 border-t border-neutral-200">
          <div className="rounded-[var(--radius-lg)] premium-gradient p-4 text-center">
            <Crown className="h-6 w-6 text-secondary-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">{t.nav.goPremium}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{t.nav.unlockFeatures}</p>
            <Link
              href="/premium"
              className="mt-3 inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] gold-gradient px-4 text-xs font-semibold text-white w-full hover:brightness-110 transition"
            >
              {t.nav.upgradeNow}
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
