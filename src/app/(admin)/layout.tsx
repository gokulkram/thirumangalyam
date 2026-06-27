"use client";

import Link from "next/link";
import {
  Shield, Bell, LogOut, Menu, X, CheckCheck,
  LayoutDashboard, Users, ShieldCheck, Flag, CreditCard, Settings,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { useAdminStore } from "@/store/admin-store";
import { usePathname } from "next/navigation";

const MOBILE_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck, badgeKey: "pendingVerifications" as const },
  { href: "/admin/reports", label: "Reports", icon: Flag, badgeKey: "openReports" as const },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = useAdminStore((s) => s.admin);
  const stats = useAdminStore((s) => s.stats);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const totalNotifs = (stats.pendingVerifications || 0) + (stats.openReports || 0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg-secondary">
      {/* Admin Header */}
      <header className="sticky top-0 z-[300] border-b border-rose-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold leading-tight text-neutral-900">
                  Thirumangalyam
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-600">
                  Admin Panel
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                className="relative p-2.5 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {totalNotifs > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {totalNotifs > 99 ? "99+" : totalNotifs}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-[var(--radius-lg)] border border-neutral-200 bg-white shadow-lg z-[400]">
                  <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                    <p className="text-sm font-semibold text-neutral-900">Notifications</p>
                    {totalNotifs > 0 && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        {totalNotifs} pending
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto">
                    {stats.pendingVerifications > 0 && (
                      <Link
                        href="/admin/verifications"
                        onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                          <ShieldCheck className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {stats.pendingVerifications} pending verification{stats.pendingVerifications !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">Profile photo verifications awaiting review</p>
                        </div>
                      </Link>
                    )}

                    {stats.openReports > 0 && (
                      <Link
                        href="/admin/reports"
                        onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100">
                          <Flag className="h-4 w-4 text-rose-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {stats.openReports} open report{stats.openReports !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">User reports require your attention</p>
                        </div>
                      </Link>
                    )}

                    {totalNotifs === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                        <CheckCheck className="h-8 w-8 mb-2" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs mt-0.5">No pending actions</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-neutral-100 px-4 py-2.5">
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-medium text-rose-600 hover:text-rose-700"
                    >
                      View dashboard →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 hover:bg-neutral-100 transition-colors ml-1">
                <Avatar name={admin.name} size="sm" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-neutral-900">{admin.name}</p>
                  <p className="text-xs text-rose-600 font-medium capitalize">
                    {admin.role.replace("_", " ")}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-error cursor-pointer" onSelect={() => signOut({ callbackUrl: "/admin-login" })}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <AdminSidebar />

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[250] lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-16 bottom-0 w-64 bg-white border-r border-neutral-200 overflow-y-auto">
              <nav className="p-2">
                {MOBILE_LINKS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  const badgeCount = "badgeKey" in item && item.badgeKey ? (stats[item.badgeKey] || 0) : 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-rose-50 text-rose-700"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {badgeCount > 0 && (
                        <span className={cn(
                          "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                          isActive ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700"
                        )}>
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <main id="main-content" className="flex-1 min-w-0">
          <div className="mx-auto max-w-[1120px] px-4 py-6 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
