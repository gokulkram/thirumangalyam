"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, MessageSquare, Search, Heart, Eye, Settings, CheckCheck, Inbox } from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "@/lib/i18n";

interface NavCounts {
  pendingReceived: number;
  pendingSent: number;
  shortlistCount: number;
  viewedMeCount: number;
}

interface AppHeaderProps {
  user?: {
    name: string;
    photoUrl?: string;
    isPremium: boolean;
  };
  unreadMessages?: number;
  unreadNotifications?: number;
  navCounts?: NavCounts;
}

export function AppHeader({
  user = { name: "User", isPremium: false },
  unreadMessages = 0,
  unreadNotifications = 0,
  navCounts = { pendingReceived: 0, pendingSent: 0, shortlistCount: 0, viewedMeCount: 0 },
}: AppHeaderProps) {
  const { t } = useTranslation();

  const totalNotifications =
    navCounts.pendingReceived + (navCounts.viewedMeCount > 0 ? 1 : 0);

  return (
    <header className="sticky top-0 z-[300] border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 sm:h-16 max-w-[1440px] items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Logo />

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: "/dashboard", label: t.nav.dashboard },
              { href: "/search",    label: t.common.search  },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Search (mobile) */}
          <Link
            href="/search"
            className="lg:hidden p-2.5 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Messages */}
          <Link
            href="/chat"
            className="relative p-2.5 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>

          {/* Notifications bell — dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2.5 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors">
                <Bell className="h-5 w-5" />
                {totalNotifications > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                    {totalNotifications > 9 ? "9+" : totalNotifications}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72">
              {/* Header */}
              <div className="px-4 py-3 border-b border-neutral-100">
                <p className="text-sm font-semibold text-neutral-900">Notifications</p>
              </div>

              {/* Interests received */}
              <Link href="/interests?tab=received" className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${navCounts.pendingReceived > 0 ? "bg-rose-100" : "bg-neutral-100"}`}>
                  <Inbox className={`h-4 w-4 ${navCounts.pendingReceived > 0 ? "text-rose-600" : "text-neutral-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">Interests Received</p>
                  <p className="text-xs text-neutral-500">
                    {navCounts.pendingReceived > 0
                      ? `${navCounts.pendingReceived} pending — tap to respond`
                      : "No new interests"}
                  </p>
                </div>
                {navCounts.pendingReceived > 0 && (
                  <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {navCounts.pendingReceived}
                  </span>
                )}
              </Link>

              {/* Accepted interests */}
              <Link href="/interests?tab=accepted" className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <CheckCheck className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">Accepted Interests</p>
                  <p className="text-xs text-neutral-500">View your accepted matches</p>
                </div>
              </Link>

              {/* Messages */}
              <Link href="/chat" className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${unreadMessages > 0 ? "bg-blue-100" : "bg-neutral-100"}`}>
                  <MessageSquare className={`h-4 w-4 ${unreadMessages > 0 ? "text-blue-600" : "text-neutral-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">Messages</p>
                  <p className="text-xs text-neutral-500">
                    {unreadMessages > 0 ? `${unreadMessages} unread message${unreadMessages > 1 ? "s" : ""}` : "No new messages"}
                  </p>
                </div>
                {unreadMessages > 0 && (
                  <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadMessages}
                  </span>
                )}
              </Link>

              {/* Who viewed me */}
              <Link href="/who-viewed-me" className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${navCounts.viewedMeCount > 0 ? "bg-violet-100" : "bg-neutral-100"}`}>
                  <Eye className={`h-4 w-4 ${navCounts.viewedMeCount > 0 ? "text-violet-600" : "text-neutral-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">Profile Views</p>
                  <p className="text-xs text-neutral-500">
                    {navCounts.viewedMeCount > 0
                      ? `${navCounts.viewedMeCount} people viewed your profile`
                      : "No recent views"}
                  </p>
                </div>
              </Link>

              <DropdownMenuSeparator />

              {/* Notification settings link */}
              <Link href="/settings?tab=notifications" className="flex items-center gap-2 px-4 py-2.5 text-xs text-neutral-500 hover:text-primary-600 hover:bg-neutral-50 transition-colors">
                <Settings className="h-3.5 w-3.5" />
                Manage notification preferences
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language switcher */}
          <LanguageSwitcher className="hidden sm:flex" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 hover:bg-neutral-100 transition-colors ml-1">
              <Avatar src={user.photoUrl} name={user.name} size="sm" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
                {user.isPremium ? (
                  <Badge variant="premium" size="sm" className="mt-1">{t.common.premium}</Badge>
                ) : (
                  <Link href="/premium" className="text-xs text-secondary-600 font-medium hover:underline">
                    {t.nav.upgradePremium}
                  </Link>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile/me">{t.nav.myProfile}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/interests">{t.nav.interests}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">{t.nav.settings}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-error cursor-pointer" onSelect={() => signOut({ callbackUrl: "/login" })}>
                {t.nav.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
