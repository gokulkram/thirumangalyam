"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Flag,
  CreditCard,
  Settings,
  Network,
  ClipboardList,
  Mail,
  ScanSearch,
  Tag,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/store/admin-store";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "@/lib/i18n";

export function AdminSidebar() {
  const pathname = usePathname();
  const stats = useAdminStore((s) => s.stats);
  const { t } = useTranslation();

  const ADMIN_LINKS = [
    { href: "/admin/dashboard", label: t.admin.dashboard, icon: LayoutDashboard },
    { href: "/admin/users", label: t.admin.users, icon: Users },
    { href: "/admin/verifications", label: t.admin.verifications, icon: ShieldCheck, badgeKey: "pendingVerifications" as const },
    { href: "/admin/reports", label: t.admin.reports, icon: Flag, badgeKey: "openReports" as const },
    { href: "/admin/subscriptions", label: t.admin.subscriptions, icon: CreditCard },
    { href: "/admin/communities", label: "Communities", icon: Network },
    { href: "/admin/activity-log", label: "Activity Log", icon: ClipboardList },
    { href: "/admin/email-campaigns", label: "Email Campaigns", icon: Mail },
    { href: "/admin/duplicate-detection", label: "Duplicates", icon: ScanSearch },
    { href: "/admin/promo-codes", label: "Promo Codes", icon: Tag },
    { href: "/admin/support", label: "Support Tickets", icon: LifeBuoy, badgeKey: "openTickets" as const },
    { href: "/admin/settings", label: t.admin.settings, icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 border-r border-neutral-200 bg-white h-[calc(100dvh-64px)] sticky top-16 overflow-y-auto">
      {/* Admin badge */}
      <div className="p-4 border-b border-neutral-200">
        <div className="rounded-[var(--radius-md)] bg-rose-50 px-3 py-2 text-center">
          <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
            {t.admin.panel}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {ADMIN_LINKS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const badgeCount = item.badgeKey ? stats[item.badgeKey] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
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
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    isActive
                      ? "bg-rose-600 text-white"
                      : "bg-rose-100 text-rose-700"
                  )}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Language + Footer */}
      <div className="p-4 border-t border-neutral-200 space-y-3">
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          {t.nav.backToUserApp}
        </Link>
      </div>
    </aside>
  );
}
