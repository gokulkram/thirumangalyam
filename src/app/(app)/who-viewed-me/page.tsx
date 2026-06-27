"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Eye, Lock, Crown, MapPin, CheckCircle, Loader2, TrendingUp, Calendar } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Visitor {
  id: string;
  profileId: string;
  name: string;
  age: number;
  occupation: string;
  location: string;
  community: string;
  visitedAt: string;
  isVerified: boolean;
  isBlurred: boolean;
  photoUrl: string;
}

interface ViewStats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  today: number;
  trend: { date: string; count: number }[];
}

function timeGroup(dateStr: string): string {
  if (!dateStr) return "Earlier";
  const now = new Date();
  const d = new Date(dateStr);
  const dayMs = 86400000;
  const diff = now.getTime() - d.getTime();
  if (diff < dayMs) return "Today";
  if (diff < 2 * dayMs) return "Yesterday";
  if (diff < 7 * dayMs) return "This Week";
  if (diff < 30 * dayMs) return "This Month";
  return "Earlier";
}

const GROUP_ORDER = ["Today", "Yesterday", "This Week", "This Month", "Earlier"];

// Tiny sparkline bar using pure CSS
function Sparkline({ trend }: { trend: { date: string; count: number }[] }) {
  const max = Math.max(...trend.map((t) => t.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {trend.map((t, i) => (
        <div
          key={i}
          title={`${t.date}: ${t.count} views`}
          className={cn(
            "flex-1 rounded-sm min-h-[2px] transition-all",
            t.count > 0 ? "bg-primary-400" : "bg-neutral-200"
          )}
          style={{ height: `${Math.max(2, (t.count / max) * 32)}px` }}
        />
      ))}
    </div>
  );
}

export default function WhoViewedMePage() {
  const { t } = useTranslation();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<ViewStats | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [visitorsRes, statsRes] = await Promise.all([
        fetch("/api/visitors"),
        fetch("/api/analytics/profile-views"),
      ]);

      if (!visitorsRes.ok) throw new Error("Failed to fetch visitors");
      const visitorsData = await visitorsRes.json();

      const mapped: Visitor[] = (visitorsData.visitors ?? []).map((v: any) => {
        const photos = v.profile?.photos || [];
        const primaryPhoto = photos.find((ph: any) => ph.isPrimary) || photos[0];
        return {
          id: v._id?.toString() || v.viewerId?.toString() || "",
          profileId: v.profile?.userId?.toString() || v.viewerId?.toString() || "",
          name: v.profile?.fullName || "Unknown",
          age: v.profile?.age || 0,
          occupation: v.profile?.occupation || "",
          location: v.profile?.city || "",
          community: v.profile?.community || "",
          visitedAt: v.createdAt || "",
          isVerified: v.profile?.verificationStatus === "verified",
          isBlurred: v.blurred || false,
          photoUrl: primaryPhoto?.url || "",
        };
      });
      setVisitors(mapped);
      setIsPremium(visitorsData.isPremium ?? false);

      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const grouped = useMemo(() => {
    const map = new Map<string, Visitor[]>();
    for (const v of visitors) {
      const g = timeGroup(v.visitedAt);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(v);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ label: g, items: map.get(g)! }));
  }, [visitors]);

  const blurredCount = visitors.filter((v) => v.isBlurred).length;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
    </div>
  );

  if (error && visitors.length === 0) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">{t.whoViewedMe.title}</h1>
      <div className="text-center py-12">
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={fetchData} className="mt-3 text-sm text-primary-600 hover:underline">Try again</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t.whoViewedMe.title}</h1>
        <p className="text-sm text-neutral-500 mt-1">{visitors.length} unique visitors</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Views", value: stats.total, icon: Eye, color: "text-primary-600", bg: "bg-primary-50" },
            { label: "This Month", value: stats.thisMonth, icon: Calendar, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "This Week", value: stats.thisWeek, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Today", value: stats.today, icon: Eye, color: "text-amber-600", bg: "bg-amber-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={cn("rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-4")}>
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("h-7 w-7 rounded-full flex items-center justify-center", bg)}>
                  <Icon className={cn("h-3.5 w-3.5", color)} />
                </div>
                <span className="text-xs text-neutral-500 font-medium">{label}</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 14-day sparkline */}
      {stats && stats.trend.some((t) => t.count > 0) && (
        <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-neutral-700">Profile views — last 14 days</p>
            <span className="text-xs text-neutral-400">
              {stats.trend.reduce((s, t) => s + t.count, 0)} total
            </span>
          </div>
          <Sparkline trend={stats.trend} />
          <div className="flex justify-between mt-1 text-[10px] text-neutral-400">
            <span>{stats.trend[0]?.date.slice(5).replace("-", " ")}</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Premium upsell */}
      {blurredCount > 0 && (
        <Card variant="flat" padding="md" className="bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 shrink-0">
              <Crown className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-900">
                {blurredCount} more profile{blurredCount !== 1 ? "s" : ""} viewed you
              </p>
              <p className="text-xs text-primary-700">Upgrade to Premium to see all visitors</p>
            </div>
            <Button size="sm" asChild><Link href="/premium">Upgrade</Link></Button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {visitors.length === 0 && (
        <div className="text-center py-12">
          <Eye className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-700">{t.whoViewedMe.noVisitors}</h2>
          <p className="text-sm text-neutral-500 mt-1">{t.whoViewedMe.noVisitorsHint}</p>
        </div>
      )}

      {/* Timeline grouped list */}
      {grouped.map(({ label, items }) => (
        <div key={label}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">{label}</h2>
            <span className="text-xs text-neutral-400 bg-neutral-100 rounded-full px-2 py-0.5">{items.length}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => (
              <Card key={v.id} variant="flat" padding="md" className="relative">
                {v.isBlurred && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-[var(--radius-lg)]">
                    <Lock className="h-6 w-6 text-neutral-400 mb-2" />
                    <p className="text-sm font-medium text-neutral-600">{t.whoViewedMe.premiumOnly}</p>
                    <Button size="sm" variant="secondary" className="mt-2" asChild>
                      <Link href="/premium">{t.whoViewedMe.unlock}</Link>
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {v.photoUrl ? (
                    <img src={v.photoUrl} alt={v.name} className="h-12 w-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-lg font-bold shrink-0">
                      {v.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-neutral-900 truncate">{v.name}{v.age ? `, ${v.age}` : ""}</h3>
                      {v.isVerified && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                    </div>
                    <p className="text-sm text-neutral-600 truncate">{v.occupation}</p>
                    <div className="flex items-center gap-1 text-xs text-neutral-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {v.location}{v.community ? ` · ${v.community}` : ""}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-neutral-400">
                    <Eye className="h-3 w-3" />
                    {v.visitedAt ? new Date(v.visitedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/profile/${v.profileId}`}>{t.whoViewedMe.viewProfile}</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
