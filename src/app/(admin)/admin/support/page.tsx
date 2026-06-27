"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LifeBuoy, RefreshCw, Loader2, AlertCircle, Crown, ChevronRight,
  Clock, CheckCircle2, Send, X,
} from "lucide-react";
import { Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Ticket {
  _id: string;
  ticketNumber: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  isPremium: boolean;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetail extends Ticket {
  messages: { senderRole: string; senderName: string; content: string; createdAt: string }[];
  userPhone: string;
  resolvedAt?: string;
}

const STATUS_VARIANT: Record<string, any> = {
  open: "warning", in_progress: "primary", resolved: "success", closed: "default",
};
const PRIORITY_COLOR: Record<string, string> = {
  low: "text-neutral-400", normal: "text-blue-600",
  high: "text-amber-600", urgent: "text-red-600 font-semibold",
};
const CAT_LABELS: Record<string, string> = {
  account: "Account", payment: "Payment", technical: "Technical",
  profile: "Profile", match: "Matches", other: "Other",
};

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [premiumFilter, setPremiumFilter] = useState("");

  // Detail panel
  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (premiumFilter) params.set("isPremium", premiumFilter);
      params.set("limit", "50");
      const res = await fetch(`/api/admin/support?${params}`);
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
      setOpenCount(data.openCount || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, premiumFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    setSelected(null);
    setReply("");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/support/${id}`);
      const data = await res.json();
      setSelected(data.ticket);
      setNewStatus(data.ticket.status);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAdminAction() {
    if (!selected) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/support/${selected._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: reply.trim() || undefined,
          status: newStatus !== selected.status ? newStatus : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelected(data.ticket);
      setNewStatus(data.ticket.status);
      setReply("");
      setMsg("Updated successfully");
      await fetchTickets();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-rose-500" />
            Support Tickets
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {openCount} open · {total} total
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchTickets}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["", "open", "in_progress", "resolved", "closed"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === s ? "bg-rose-100 text-rose-700" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {s ? s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "All Status"}
          </button>
        ))}
        <span className="text-neutral-300 self-center">|</span>
        {[["", "All Plans"], ["true", "Premium ⭐"], ["false", "Free"]].map(([val, label]) => (
          <button
            key={val || "all-plans"}
            onClick={() => setPremiumFilter(val)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              premiumFilter === val ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Split layout: list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket list */}
        <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <AlertCircle className="h-7 w-7 text-red-400" />
              <p className="text-sm text-neutral-600">{error}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-neutral-400">
              <LifeBuoy className="h-8 w-8" />
              <p className="text-sm">No tickets match your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {tickets.map((t) => (
                <button
                  key={t._id}
                  onClick={() => openDetail(t._id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 transition-colors",
                    selected?._id === t._id && "bg-rose-50/60"
                  )}
                >
                  <div className="shrink-0">
                    {t.status === "resolved" || t.status === "closed"
                      ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      : <Clock className="h-4.5 w-4.5 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium text-neutral-900 truncate">{t.subject}</p>
                      {t.isPremium && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 flex-wrap">
                      <span className="font-mono">{t.ticketNumber}</span>
                      <span>{t.userName}</span>
                      <span className={cn("capitalize", PRIORITY_COLOR[t.priority])}>{t.priority}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Badge variant={STATUS_VARIANT[t.status]} size="sm">
                      {t.status.replace("_", " ")}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white overflow-hidden flex flex-col min-h-[400px]">
          {detailLoading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
            </div>
          ) : !selected ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-neutral-400">
              <LifeBuoy className="h-8 w-8" />
              <p className="text-sm">Select a ticket to view details</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Ticket header */}
              <div className="px-5 py-4 border-b border-neutral-100 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-neutral-900 truncate">{selected.subject}</p>
                      {selected.isPremium && <Crown className="h-4 w-4 text-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 flex-wrap">
                      <span className="font-mono">{selected.ticketNumber}</span>
                      <span>{selected.userName}</span>
                      {selected.userEmail && <span>{selected.userEmail}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                      <span className="text-neutral-500">{CAT_LABELS[selected.category]}</span>
                      <span className={cn("capitalize", PRIORITY_COLOR[selected.priority])}>{selected.priority} priority</span>
                      <span className="text-neutral-400">{fmt(selected.createdAt)}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1 text-neutral-400 hover:text-neutral-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Status + controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="h-8 rounded-[var(--radius-md)] border border-neutral-300 bg-white px-2 text-xs focus:border-rose-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                    ))}
                  </select>
                  {msg && (
                    <span className={cn("text-xs", msg.startsWith("Error") ? "text-red-600" : "text-emerald-600")}>{msg}</span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[320px]">
                {(selected.messages || []).map((m, i) => {
                  const isAdmin = m.senderRole === "admin";
                  return (
                    <div key={i} className={cn("flex gap-2", isAdmin ? "flex-row-reverse" : "")}>
                      <div className={cn(
                        "h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                        isAdmin ? "bg-rose-100 text-rose-700" : "bg-neutral-100 text-neutral-600"
                      )}>
                        {isAdmin ? "A" : m.senderName?.charAt(0) || "U"}
                      </div>
                      <div className="max-w-[75%]">
                        <div className={cn(
                          "rounded-[var(--radius-lg)] px-3 py-2 text-sm",
                          isAdmin
                            ? "bg-rose-50 text-neutral-800 rounded-tr-none"
                            : "bg-neutral-100 text-neutral-800 rounded-tl-none"
                        )}>
                          {m.content}
                        </div>
                        <p className={cn("text-[10px] text-neutral-400 mt-0.5 px-1", isAdmin ? "text-right" : "")}>
                          {isAdmin ? "Support Team" : m.senderName} · {fmt(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply */}
              {selected.status !== "closed" && (
                <div className="px-4 py-3 border-t border-neutral-100 flex gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to user..."
                    rows={2}
                    className="flex-1 rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-100 focus:outline-none resize-none"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={sendingReply || (!reply.trim() && newStatus === selected.status)}
                    onClick={handleAdminAction}
                    className="self-end"
                  >
                    {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
