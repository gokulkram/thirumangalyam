"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface AppHeaderProps {
  user?: {
    name: string;
    photoUrl?: string;
    isPremium: boolean;
  };
  unreadMessages?: number;
  unreadNotifications?: number;
}

export function AppHeader({
  user = { name: "User", isPremium: false },
  unreadMessages = 0,
  unreadNotifications = 0,
}: AppHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-[300] border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Logo />

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: "/dashboard", label: t.nav.dashboard },
              { href: "/search", label: t.common.search },
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

          {/* Notifications */}
          <button className="relative p-2.5 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>

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
              <DropdownMenuItem className="text-error cursor-pointer" onSelect={() => signOut({ callbackUrl: "/login" })}>{t.nav.logout}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
