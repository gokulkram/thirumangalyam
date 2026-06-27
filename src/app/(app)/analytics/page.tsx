"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye, Heart, TrendingUp, Users, ArrowUpRight, Clock, CheckCircle2,
  XCircle, Loader2, BarChart3, Send, Inbox, Handshake, Calendar,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface InterestStats {
  sent: { total: number; accepted: number; declined: number; pending: number; withdrawn: number; acceptRate: number };
  received: { total: number; accepted: number; declined: number; pending: number; responseRate: number };
  avgResponseHours: number | null;
  profileViews: number;
  conversionRate: number;
  weeklyTrend: { week: string; sent: number; received: number }[];
}

interface ViewStats {
  total: number; thisWeek: number; thisMonth: number; today: number;
  trend: { date: string; count: number }[];
}

function StatTile({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", color)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-neutral-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function RateBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-neutral-600">{label}</span>
        <span className="font-semibold text-neutral-800">{value} <span className="text-neutral-400">({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [interests, setInterests] = useState<InterestStats | null>(null);
  const [views, setViews] = useState<ViewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/interests").then((r) => r.json()),
      fetch("/api/analytics/profile-views").then((r) => r.json()),
    ]).then(([i, v]) => {
      setInterests(i);
      setViews(v);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
    </div>
  );

  const i = interests!;
  const v = views!;

  // Match funnel steps
  const funnelSteps = [
    { label: "Profile Views", value: v?.total ?? 0, icon: Eye, color: "bg-blue-500" },
    { label: "Interests Received", value: i?.received.total ?? 0, icon: Inbox, color: "bg-violet-500" },
    { label: "Interests Sent", value: i?.sent.total ?? 0, icon: Send, color: "bg-amber-500" },
    { label: "Accepted Matches", value: (i?.received.accepted ?? 0) + (i?.sent.accepted ?? 0), icon: Handshake, color: "bg-emerald-500" },
  ];
  const funnelMax = funnelSteps[0].value || 1;

  const weekMax = Math.max(...(i?.weeklyTrend.flatMap((w) => [w.sent, w.received]) || [1]), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary-600" /> My Analytics
          </h1>
          <p className="text-sm text-neutral-500 mt-1">How your profile is performing</p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/who-viewed-me">
            <Eye className="h-4 w-4" /> Who Viewed Me
          </Link>
        </Button>
      </div>

      {/* Profile Views section */}
      <section>
        <h2 className="text-base font-semibold text-neutral-700 mb-3">Profile Visibility</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Total Views" value={v?.total ?? 0} icon={Eye} color="bg-blue-50 text-blue-600" />
          <StatTile label="This Month" value={v?.thisMonth ?? 0} icon={TrendingUp} color="bg-violet-50 text-violet-600" sub="last 30 days" />
          <StatTile label="This Week" value={v?.thisWeek ?? 0} icon={Calendar ?? TrendingUp} color="bg-emerald-50 text-emerald-600" sub="last 7 days" />
          <StatTile label="Today" value={v?.today ?? 0} icon={Eye} color="bg-amber-50 text-amber-600" />
        </div>
      </section>

      {/* Interest Performance */}
      <section>
        <h2 className="text-base font-semibold text-neutral-700 mb-3">Interest Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sent interests */}
          <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-neutral-800">Interests Sent</h3>
              <Badge variant="warning" size="sm">{i?.sent.total ?? 0} total</Badge>
            </div>
            <div className="space-y-3">
              <RateBar label="Accepted" value={i?.sent.accepted ?? 0} max={i?.sent.total ?? 0} color="bg-emerald-500" />
              <RateBar label="Pending" value={i?.sent.pending ?? 0} max={i?.sent.total ?? 0} color="bg-amber-400" />
              <RateBar label="Declined" value={i?.sent.declined ?? 0} max={i?.sent.total ?? 0} color="bg-red-400" />
            </div>
            <div className="rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-emerald-700 font-medium">Acceptance Rate</span>
              <span className="text-lg font-bold text-emerald-700">{i?.sent.acceptRate ?? 0}%</span>
            </div>
          </div>

          {/* Received interests */}
          <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-neutral-800">Interests Received</h3>
              <Badge variant="primary" size="sm">{i?.received.total ?? 0} total</Badge>
            </div>
            <div className="space-y-3">
              <RateBar label="Accepted" value={i?.received.accepted ?? 0} max={i?.received.total ?? 0} color="bg-emerald-500" />
              <RateBar label="Pending" value={i?.received.pending ?? 0} max={i?.received.total ?? 0} color="bg-amber-400" />
              <RateBar label="Declined" value={i?.received.declined ?? 0} max={i?.received.total ?? 0} color="bg-red-400" />
            </div>
            <div className="rounded-[var(--radius-md)] bg-blue-50 border border-blue-200 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-blue-700 font-medium">Response Rate</span>
              <span className="text-lg font-bold text-blue-700">{i?.received.responseRate ?? 0}%</span>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{(i?.sent.accepted ?? 0) + (i?.received.accepted ?? 0)}</p>
            <p className="text-xs text-neutral-500 mt-0.5">Total Accepted</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{i?.conversionRate ?? 0}%</p>
            <p className="text-xs text-neutral-500 mt-0.5">Views → Interests</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-neutral-700">
              {i?.avgResponseHours != null ? `${i.avgResponseHours}h` : "—"}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">Avg Response Time</p>
          </div>
        </div>
      </section>

      {/* Match Funnel */}
      <section>
        <h2 className="text-base font-semibold text-neutral-700 mb-3">Match Funnel</h2>
        <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-5 space-y-3">
          {funnelSteps.map((step, idx) => {
            const width = Math.max(8, (step.value / funnelMax) * 100);
            return (
              <div key={step.label} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-xs text-neutral-600 font-medium">{step.label}</div>
                <div className="flex-1 h-8 rounded-[var(--radius-md)] bg-neutral-100 overflow-hidden relative">
                  <div
                    className={cn("h-full rounded-[var(--radius-md)] flex items-center justify-end pr-3 transition-all", step.color)}
                    style={{ width: `${width}%` }}
                  >
                    <span className="text-white text-xs font-bold">{step.value}</span>
                  </div>
                </div>
                {idx > 0 && funnelSteps[idx - 1].value > 0 && (
                  <div className="w-12 shrink-0 text-right text-xs text-neutral-400">
                    {Math.round((step.value / funnelSteps[idx - 1].value) * 100)}%
                  </div>
                )}
              </div>
            );
          })}
          <p className="text-xs text-neutral-400 pt-1">Percentages show conversion from previous step</p>
        </div>
      </section>

      {/* Weekly Trend */}
      {i?.weeklyTrend && i.weeklyTrend.some((w) => w.sent > 0 || w.received > 0) && (
        <section>
          <h2 className="text-base font-semibold text-neutral-700 mb-3">8-Week Interest Trend</h2>
          <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-5">
            <div className="flex items-end gap-2 h-24">
              {i.weeklyTrend.map((week, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="flex items-end gap-0.5 flex-1 w-full">
                    <div
                      className="flex-1 rounded-t-sm bg-amber-400 min-h-[2px] transition-all"
                      style={{ height: `${Math.max(2, (week.sent / weekMax) * 80)}px` }}
                      title={`Sent: ${week.sent}`}
                    />
                    <div
                      className="flex-1 rounded-t-sm bg-violet-400 min-h-[2px] transition-all"
                      style={{ height: `${Math.max(2, (week.received / weekMax) * 80)}px` }}
                      title={`Received: ${week.received}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-neutral-400">
              <span>{i.weeklyTrend[0]?.week}</span>
              <span>This week</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" /> Sent</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-violet-400 inline-block" /> Received</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
