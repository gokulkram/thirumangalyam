"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Send, Loader2, Crown, CheckCircle2, LifeBuoy, Clock,
} from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
};
const STATUS_VARIANT: Record<string, any> = {
  open: "warning", in_progress: "primary", resolved: "success", closed: "default",
};
const PRIORITY_COLOR: Record<string, string> = {
  low: "text-neutral-500", normal: "text-blue-600",
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

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/support/${id}`)
      .then((r) => r.json())
      .then((d) => setTicket(d.ticket))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  async function sendReply() {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTicket(data.ticket);
      setReply("");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
    </div>
  );
  if (!ticket) return (
    <div className="text-center py-16 text-neutral-500">
      Ticket not found. <Link href="/support" className="text-rose-500 hover:underline">Go back</Link>
    </div>
  );

  const isClosed = ticket.status === "closed";
  const isResolved = ticket.status === "resolved" || isClosed;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/support" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to Support
        </Link>

        {justCreated && (
          <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Ticket submitted! Our team will get back to you soon.
          </div>
        )}

        {/* Ticket meta */}
        <Card variant="flat" padding="lg">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-neutral-900">{ticket.subject}</h1>
                {ticket.isPremium && <Crown className="h-4 w-4 text-amber-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500 flex-wrap">
                <span className="font-mono">{ticket.ticketNumber}</span>
                <span>{CAT_LABELS[ticket.category] || ticket.category}</span>
                <span className={cn("capitalize", PRIORITY_COLOR[ticket.priority])}>
                  {ticket.priority} priority
                </span>
                <span>Opened {fmt(ticket.createdAt)}</span>
              </div>
            </div>
            <Badge variant={STATUS_VARIANT[ticket.status]} size="sm">
              {STATUS_LABEL[ticket.status]}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Message thread */}
      <div className="space-y-3">
        {(ticket.messages || []).map((msg: any, i: number) => {
          const isAdmin = msg.senderRole === "admin";
          return (
            <div key={i} className={cn("flex gap-3", isAdmin ? "flex-row-reverse" : "")}>
              <div className={cn(
                "h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                isAdmin ? "bg-rose-100 text-rose-700" : "bg-neutral-100 text-neutral-600"
              )}>
                {isAdmin ? <LifeBuoy className="h-4 w-4" /> : (msg.senderName?.charAt(0) || "U")}
              </div>
              <div className={cn("max-w-[80%] space-y-1", isAdmin ? "items-end" : "")}>
                <div className={cn(
                  "rounded-[var(--radius-lg)] px-4 py-3 text-sm leading-relaxed",
                  isAdmin
                    ? "bg-rose-50 text-neutral-800 rounded-tr-sm"
                    : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
                <p className={cn("text-[10px] text-neutral-400 px-1", isAdmin ? "text-right" : "")}>
                  {isAdmin ? `Support Team` : msg.senderName} · {fmt(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      {!isClosed ? (
        <Card variant="flat" padding="lg">
          {isResolved && (
            <p className="text-xs text-emerald-600 mb-3 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ticket resolved — reply below to reopen it if your issue persists.
            </p>
          )}
          <div className="flex gap-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply..."
              rows={3}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) sendReply(); }}
              className="flex-1 rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none resize-none"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="self-end"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Ctrl+Enter to send</p>
        </Card>
      ) : (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-neutral-50 border border-neutral-200 px-4 py-3 text-sm text-neutral-500">
          <Clock className="h-4 w-4 shrink-0" />
          This ticket is closed. <Link href="/support/new" className="text-rose-500 hover:underline ml-1">Open a new ticket</Link> if you need further help.
        </div>
      )}
    </div>
  );
}
