"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/export-csv";
import type { ActivityLogEntry } from "@/types/admin";

const ACTION_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  user_registered:    { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500", label: "Registered" },
  user_login:         { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500",    label: "Login" },
  user_ban:           { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500",     label: "Banned" },
  user_suspend:       { bg: "bg-orange-50",   text: "text-orange-700",  dot: "bg-orange-500",  label: "Suspended" },
  user_activate:      { bg: "bg-green-50",    text: "text-green-700",   dot: "bg-green-500",   label: "Activated" },
  user_make_premium:  { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500",   label: "Upgraded" },
  user_downgrade:     { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400", label: "Downgraded" },
  verification_approved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Verified" },
  verification_rejected: { bg: "bg-red-50",   text: "text-red-700",    dot: "bg-red-500",     label: "Rej. Verify" },
  report_resolved:    { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500",    label: "Resolved" },
  report_dismissed:   { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400", label: "Dismissed" },
  email_campaign_sent:{ bg: "bg-purple-50",   text: "text-purple-700",  dot: "bg-purple-500",  label: "Campaign" },
};

function getStyle(action: string) {
  return ACTION_STYLE[action] ?? {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    dot: "bg-neutral-400",
    label: action.replace(/_/g, " "),
  };
}

const PAGE_SIZE = 25;

interface PaginationState {
  page: number;
  totalPages: number;
  total: number;
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paging, setPaging] = useState<PaginationState>({ page: 1, totalPages: 1, total: 0 });

  // Filter inputs (what the user is typing)
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Applied filters (what the last fetch used)
  const [applied, setApplied] = useState({ search: "", action: "", from: "", to: "" });

  async function fetchLogs(page: number, filters = applied) {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (filters.search) params.set("search", filters.search);
      if (filters.action) params.set("action", filters.action);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to + "T23:59:59");

      const res = await fetch(`/api/admin/activity-log?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activity log");
      const data = await res.json();

      setEntries(data.entries || []);
      if (data.actionTypes?.length) setActionTypes(data.actionTypes);
      setPaging({
        page,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function applyFilters() {
    const next = { search, action: actionFilter, from: fromDate, to: toDate };
    setApplied(next);
    fetchLogs(1, next);
  }

  function clearFilters() {
    setSearch("");
    setActionFilter("");
    setFromDate("");
    setToDate("");
    const next = { search: "", action: "", from: "", to: "" };
    setApplied(next);
    fetchLogs(1, next);
  }

  function goPage(p: number) {
    setPaging((prev) => ({ ...prev, page: p }));
    fetchLogs(p);
  }

  function handleExport() {
    exportToCSV(
      `activity-log-${new Date().toISOString().slice(0, 10)}.csv`,
      entries.map((e) => ({
        Action: e.action,
        Label: getStyle(e.action).label,
        Description: e.description,
        User: e.userName || "",
        "User ID": e.userId || "",
        Timestamp: new Date(e.timestamp).toLocaleString("en-IN"),
      }))
    );
  }

  const hasFilters = applied.search || applied.action || applied.from || applied.to;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Activity Log</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {paging.total.toLocaleString()} total entries
            {hasFilters && " · filtered"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => fetchLogs(paging.page)}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={entries.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search description or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white pl-10 pr-4 text-sm placeholder:text-neutral-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-10 rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm text-neutral-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
          >
            <option value="">All Actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>
                {getStyle(a).label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm text-neutral-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm text-neutral-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={applyFilters}>
            Apply Filters
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <span className="ml-3 text-neutral-500">Loading...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-neutral-600">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => fetchLogs(paging.page)}>
            Retry
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-neutral-400">
          <ClipboardList className="h-10 w-10" />
          <p>No activity log entries found.</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
          {entries.map((entry, idx) => {
            const style = getStyle(entry.action);
            return (
              <div
                key={entry.id || idx}
                className="flex items-start gap-4 px-5 py-3.5 hover:bg-neutral-50/70 transition-colors"
              >
                {/* Dot */}
                <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", style.dot)} />

                {/* Action badge */}
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
                    style.bg,
                    style.text
                  )}
                >
                  {style.label}
                </span>

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 leading-snug">{entry.description}</p>
                  {entry.userName && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-neutral-500 font-medium">{entry.userName}</span>
                      {entry.userId && (
                        <a
                          href={`/admin/users/${entry.userId}`}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          → view
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <time className="shrink-0 text-xs text-neutral-400 whitespace-nowrap pt-0.5">
                  {new Date(entry.timestamp).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {paging.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            Page {paging.page} of {paging.totalPages} &middot; {paging.total.toLocaleString()} entries
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={paging.page === 1} onClick={() => goPage(1)}>
              First
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={paging.page === 1}
              onClick={() => goPage(paging.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 rounded-[var(--radius-md)] bg-rose-600 text-white text-sm font-medium">
              {paging.page}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={paging.page === paging.totalPages}
              onClick={() => goPage(paging.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={paging.page === paging.totalPages}
              onClick={() => goPage(paging.totalPages)}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
