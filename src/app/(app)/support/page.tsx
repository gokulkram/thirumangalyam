"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Plus, Loader2, AlertCircle, LifeBuoy, Crown, ChevronRight, Clock, CheckCircle2,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLE: Record<string, { label: string; variant: "success" | "warning" | "default" | "error" }> = {
  open:        { label: "Open",        variant: "warning" },
  in_progress: { label: "In Progress", variant: "primary" as any },
  resolved:    { label: "Resolved",    variant: "success" },
  closed:      { label: "Closed",      variant: "default" },
};

const PRIORITY_STYLE: Record<string, string> = {
  low:    "text-neutral-500",
  normal: "text-blue-600",
  high:   "text-amber-600",
  urgent: "text-red-600 font-semibold",
};

const CAT_LABELS: Record<string, string> = {
  account: "Account", payment: "Payment", technical: "Technical",
  profile: "Profile", match: "Matches", other: "Other",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function SupportPage() {
  const { isPremium } = useCurrentUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const open = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-rose-500" />
            Support
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {open > 0 ? `${open} open ticket${open !== 1 ? "s" : ""}` : "All tickets resolved"}
          </p>
        </div>
        <Button variant="primary" size="sm" asChild>
          <Link href="/support/new">
            <Plus className="h-4 w-4" /> New Ticket
          </Link>
        </Button>
      </div>

      {/* Premium priority notice */}
      {isPremium && (
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 px-4 py-3">
          <Crown className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Priority Support</p>
            <p className="text-xs text-amber-700 mt-0.5">Your tickets are flagged High priority and handled first by our team.</p>
          </div>
        </div>
      )}

      {/* Tickets list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-neutral-600">{error}</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white flex flex-col items-center py-16 gap-4">
          <LifeBuoy className="h-10 w-10 text-neutral-300" />
          <p className="font-semibold text-neutral-700">No support tickets yet</p>
          <p className="text-sm text-neutral-500 text-center max-w-xs">
            Have a question or facing an issue? Create a ticket and our team will get back to you.
          </p>
          <Button variant="primary" size="sm" asChild>
            <Link href="/support/new"><Plus className="h-4 w-4" /> Create Your First Ticket</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const s = STATUS_STYLE[ticket.status] || STATUS_STYLE.open;
            return (
              <Link
                key={ticket._id}
                href={`/support/${ticket._id}`}
                className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-neutral-200 bg-white px-5 py-4 hover:border-rose-300 hover:shadow-sm transition-all group"
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {ticket.status === "resolved" || ticket.status === "closed"
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    : <Clock className="h-5 w-5 text-amber-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{ticket.subject}</p>
                    {ticket.isPremium && (
                      <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-neutral-400 font-mono">{ticket.ticketNumber}</span>
                    <span className="text-xs text-neutral-400">{CAT_LABELS[ticket.category] || ticket.category}</span>
                    <span className={cn("text-xs capitalize", PRIORITY_STYLE[ticket.priority])}>
                      {ticket.priority} priority
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block text-right">
                    <Badge variant={s.variant} size="sm">{s.label}</Badge>
                    <p className="text-[10px] text-neutral-400 mt-1">{fmt(ticket.updatedAt)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-rose-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
