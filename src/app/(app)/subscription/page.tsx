"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Badge, Card } from "@/components/ui";
import {
  Crown,
  CheckCircle,
  Calendar,
  Clock,
  CreditCard,
  Receipt,
  ArrowLeft,
  Loader2,
  Smartphone,
  Landmark,
  Wallet,
  RefreshCw,
  Download,
  XCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  premium_3: "Premium — 3 Months",
  premium_6: "Premium — 6 Months",
  premium_12: "Premium — 12 Months",
};

const PLAN_DURATION: Record<string, string> = {
  premium_3: "3 months",
  premium_6: "6 months",
  premium_12: "12 months",
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  UPI: <Smartphone className="h-4 w-4 text-green-600" />,
  Card: <CreditCard className="h-4 w-4 text-blue-600" />,
  Netbanking: <Landmark className="h-4 w-4 text-purple-600" />,
  Wallet: <Wallet className="h-4 w-4 text-orange-500" />,
  Razorpay: <CreditCard className="h-4 w-4 text-blue-600" />,
  Test: <RefreshCw className="h-4 w-4 text-amber-500" />,
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function daysLeft(endDate: string) {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

function progressPercent(startDate: string, endDate: string) {
  const total = new Date(endDate).getTime() - new Date(startDate).getTime();
  const elapsed = Date.now() - new Date(startDate).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");

  async function handleCancel() {
    if (!activeSub) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: activeSub._id, reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");
      setCancelDialog(false);
      setCancelMsg("Membership cancelled. Your account has been reverted to the free plan.");
      setActiveSub(null);
      const updated = await fetch("/api/subscription/me").then((r) => r.json());
      setHistory(updated.history || []);
    } catch (e: any) {
      setCancelMsg(`Error: ${e.message}`);
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    fetch("/api/subscription/me")
      .then((r) => r.json())
      .then((data) => {
        setActiveSub(data.active || null);
        setHistory(data.history || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Cancel message */}
      {cancelMsg && (
        <div className={`rounded-[var(--radius-md)] border px-4 py-3 text-sm flex items-center justify-between ${cancelMsg.startsWith("Error") ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {cancelMsg}
          <button onClick={() => setCancelMsg("")} className="ml-4 text-xs opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {/* Header */}
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Membership & Orders</h1>
        <p className="text-neutral-500 mt-1 text-sm">Your subscription status and complete payment history</p>
      </div>

      {/* ── ACTIVE MEMBERSHIP ── */}
      {activeSub ? (
        <>
        <Card variant="flat" padding="lg" className="border-primary-200 bg-gradient-to-br from-primary-50 to-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <Crown className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-0.5">Active Membership</p>
                <p className="text-xl font-bold text-neutral-900">{PLAN_LABELS[activeSub.plan] || activeSub.plan}</p>
              </div>
            </div>
            <Badge variant="success" size="sm">Active</Badge>
          </div>

          {/* Progress bar — client-only to avoid hydration mismatch */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
              <span>Started {fmt(activeSub.startDate)}</span>
              <span>Expires {fmt(activeSub.endDate)}</span>
            </div>
            <div className="h-2 w-full bg-primary-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: mounted ? `${progressPercent(activeSub.startDate, activeSub.endDate)}%` : "0%" }}
              />
            </div>
            <p className="text-xs text-primary-700 font-medium mt-1.5 text-right" suppressHydrationWarning>
              {mounted ? `${daysLeft(activeSub.endDate)} days remaining` : "—"}
            </p>
          </div>

          {/* Stats grid */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Calendar className="h-3.5 w-3.5" />, label: "Start Date", value: fmt(activeSub.startDate) },
              { icon: <Calendar className="h-3.5 w-3.5" />, label: "End Date", value: fmt(activeSub.endDate) },
              { icon: <Clock className="h-3.5 w-3.5" />, label: "Duration", value: PLAN_DURATION[activeSub.plan] || "—" },
              { icon: <CreditCard className="h-3.5 w-3.5" />, label: "Amount Paid", value: `₹${activeSub.amount?.toLocaleString("en-IN")}` },
            ].map((item) => (
              <div key={item.label} className="rounded-[var(--radius-md)] bg-white border border-primary-100 p-3">
                <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">{item.icon} {item.label}</div>
                <p className="text-sm font-semibold text-neutral-800">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Features included */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {["Unlimited daily matches", "Direct chat with matches", "View contact details", "See who viewed you", "Detailed horoscope matching", "Priority support"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-neutral-600">
                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" /> {f}
              </div>
            ))}
          </div>

          {mounted && daysLeft(activeSub.endDate) <= 30 && (
            <div className="mt-4 rounded-[var(--radius-md)] bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-amber-800 font-medium" suppressHydrationWarning>
                Expires in <strong>{daysLeft(activeSub.endDate)} days</strong> — Renew to keep access
              </p>
              <Button variant="premium" size="sm" asChild>
                <Link href="/premium">Renew Now</Link>
              </Button>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/api/invoices/${activeSub._id}`, "_blank")}
            >
              <Download className="h-4 w-4" /> Download Receipt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-error hover:text-error"
              onClick={() => { setCancelReason(""); setCancelDialog(true); }}
            >
              <XCircle className="h-4 w-4" /> Cancel Membership
            </Button>
          </div>
        </Card>

        {/* Cancel dialog */}
        {cancelDialog && (
          <Dialog open onOpenChange={(o) => { if (!cancelling) setCancelDialog(o); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Membership</DialogTitle>
              </DialogHeader>
              <div className="py-2 space-y-3">
                <p className="text-sm text-neutral-600">
                  Your Premium membership will be cancelled immediately and your account reverted to the free plan.
                  This action cannot be undone.
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">Reason for cancellation (optional)</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Let us know why you're leaving..."
                    rows={3}
                    className="w-full rounded-[var(--radius-md)] border border-neutral-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" size="sm" disabled={cancelling} onClick={() => setCancelDialog(false)}>
                  Keep Membership
                </Button>
                <Button variant="destructive" size="sm" disabled={cancelling} onClick={handleCancel}>
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  {cancelling ? "Cancelling..." : "Confirm Cancel"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        </>
      ) : (
        <Card variant="flat" padding="lg">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
              <Crown className="h-6 w-6 text-neutral-400" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">No Active Membership</p>
              <p className="text-sm text-neutral-500 mt-0.5">Upgrade to unlock unlimited matches, chat, and more</p>
            </div>
          </div>
          <Button variant="premium" size="md" className="mt-4" asChild>
            <Link href="/premium">View Premium Plans</Link>
          </Button>
        </Card>
      )}

      {/* ── ORDER HISTORY ── */}
      <div>
        <h2 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-neutral-500" /> Order History
        </h2>

        {history.length === 0 ? (
          <Card variant="flat" padding="lg">
            <p className="text-sm text-neutral-500 text-center py-4">No orders yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((sub: any, idx: number) => (
              <Card key={sub._id} variant="flat" padding="lg">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  {/* Left */}
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Crown className="h-4.5 w-4.5 text-neutral-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900">
                          {PLAN_LABELS[sub.plan] || sub.plan}
                        </p>
                        {idx === 0 && activeSub && sub._id === activeSub._id && (
                          <Badge variant="success" size="sm">Current</Badge>
                        )}
                        <Badge
                          variant={sub.status === "active" ? "success" : sub.status === "cancelled" ? "error" : "outline"}
                          size="sm"
                        >
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {fmt(sub.startDate)} → {fmt(sub.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          {METHOD_ICON[sub.paymentMethod] || <CreditCard className="h-3 w-3" />}
                          {sub.paymentMethod || "Razorpay"}
                        </span>
                      </div>

                      {/* Payment IDs */}
                      <div className="mt-2 space-y-0.5">
                        {sub.razorpayOrderId && (
                          <p className="text-[10px] text-neutral-400 font-mono">
                            Order: {sub.razorpayOrderId}
                          </p>
                        )}
                        {sub.razorpayPaymentId && (
                          <p className="text-[10px] text-neutral-400 font-mono">
                            Payment: {sub.razorpayPaymentId}
                          </p>
                        )}
                        {sub.razorpaySubscriptionId && (
                          <p className="text-[10px] text-neutral-400 font-mono">
                            Subscription: {sub.razorpaySubscriptionId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right — Amount + Download */}
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-lg font-bold text-neutral-900">
                      ₹{sub.amount?.toLocaleString("en-IN")}
                    </p>
                    {sub.discountAmount > 0 && (
                      <p className="text-xs text-emerald-600">Saved ₹{sub.discountAmount?.toLocaleString("en-IN")}</p>
                    )}
                    <p className="text-xs text-neutral-400">
                      {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    <button
                      onClick={() => window.open(`/api/invoices/${sub._id}`, "_blank")}
                      className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium ml-auto"
                    >
                      <Download className="h-3 w-3" /> Receipt
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* No history + not premium */}
      {!activeSub && history.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-neutral-400">Complete your first payment to see order history here.</p>
          <Button variant="primary" size="sm" className="mt-3" asChild>
            <Link href="/premium">Get Premium</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
