"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Search,
  Heart,
  MessageSquare,
  User,
  BarChart3,
  Bookmark,
  Eye,
  Crown,
  Settings,
  LifeBuoy,
  LogOut,
  ChevronRight,
  X,
  ShieldCheck,
  Receipt,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface MobileNavProps {
  unreadMessages?: number;
  unreadInterests?: number;
}

const ACCOUNT_MENU = [
  {
    section: "Profile",
    items: [
      { href: "/profile/me",    label: "Edit Profile",    icon: User },
      { href: "/who-viewed-me", label: "Who Viewed Me",   icon: Eye },
      { href: "/shortlist",     label: "Shortlist",       icon: Bookmark },
      { href: "/analytics",     label: "My Analytics",    icon: BarChart3 },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/subscription",  label: "Membership",      icon: Receipt },
      { href: "/support",       label: "Support",         icon: LifeBuoy },
      { href: "/settings",      label: "Settings",        icon: Settings },
    ],
  },
];

export function MobileNav({ unreadMessages = 0, unreadInterests = 0 }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const user = session?.user;
  const isPremium = (user as any)?.isPremium ?? false;
  const userName = user?.name || "Member";
  const profileComplete = (user as any)?.profileComplete ?? 0;

  const TABS = [
    { href: "/dashboard",  label: t.nav.home,      icon: Home },
    { href: "/search",     label: t.common.search,  icon: Search },
    { href: "/interests",  label: t.nav.interests,  icon: Heart },
    { href: "/chat",       label: t.nav.chat,       icon: MessageSquare },
  ];

  const getBadge = (href: string) => {
    if (href === "/chat"      && unreadMessages  > 0) return unreadMessages;
    if (href === "/interests" && unreadInterests > 0) return unreadInterests;
    return 0;
  };

  const isAccountActive =
    menuOpen ||
    ["/profile/me", "/who-viewed-me", "/shortlist", "/analytics", "/subscription", "/support", "/settings"].some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[300] border-t border-neutral-200 bg-white lg:hidden">
        <div className="flex h-14 items-center justify-around">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = !menuOpen && (pathname === tab.href || pathname.startsWith(tab.href + "/"));
            const badge  = getBadge(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-[60px] transition-colors",
                  active ? "text-primary-600" : "text-neutral-400"
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

          {/* Account button */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-[60px] transition-colors",
              isAccountActive ? "text-primary-600" : "text-neutral-400"
            )}
          >
            <div className="relative">
              <User className="h-5 w-5" />
              {isPremium && (
                <span className="absolute -top-1 -right-1.5 h-3 w-3 rounded-full bg-amber-400 border border-white flex items-center justify-center">
                  <Crown className="h-1.5 w-1.5 text-white" />
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* Account Drawer */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[350] bg-black/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />

          {/* Slide-up sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[360] lg:hidden rounded-t-2xl bg-white shadow-2xl max-h-[88dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-neutral-300" />
            </div>

            {/* User info */}
            <div className="px-5 pb-4 pt-2 shrink-0">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
                  isPremium ? "bg-amber-100 text-amber-700" : "bg-primary-100 text-primary-700"
                )}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">{userName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isPremium ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Crown className="h-2.5 w-2.5" /> Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                        Free Plan
                      </span>
                    )}
                    {profileComplete < 100 && (
                      <span className="text-[10px] text-neutral-400">{profileComplete}% profile</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Upgrade CTA for free users */}
              {!isPremium && (
                <Link
                  href="/premium"
                  onClick={() => setMenuOpen(false)}
                  className="mt-3 flex items-center gap-2 rounded-[var(--radius-lg)] bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-rose-600 hover:to-rose-700 transition-all"
                >
                  <Zap className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Upgrade to Premium</span>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-75" />
                </Link>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
              {ACCOUNT_MENU.map(({ section, items }) => (
                <div key={section}>
                  <p className="px-5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {section}
                  </p>
                  <div className="px-3">
                    {items.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href || pathname.startsWith(href + "/");
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary-50 text-primary-700"
                              : "text-neutral-700 hover:bg-neutral-50"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 shrink-0", active ? "text-primary-600" : "text-neutral-400")} />
                          <span className="flex-1">{label}</span>
                          {active && <div className="h-1.5 w-1.5 rounded-full bg-primary-600 shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Logout */}
              <div className="px-3 pt-3 pb-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

          </div>
        </>
      )}
    </>
  );
}
