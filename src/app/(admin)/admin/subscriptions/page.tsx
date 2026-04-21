"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IndianRupee,
  TrendingUp,
  Crown,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "@/components/domain/stat-card";
import { Badge, Button } from "@/components/ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { Subscription } from "@/types/admin";

const PLAN_LABELS: Record<string, string> = {
  premium_3: "Premium 3M",
  premium_6: "Premium 6M",
  premium_12: "Premium 12M",
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<string>("all");

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "1000");
      const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      const json = await res.json();
      setSubscriptions(json.subscriptions || json || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-3 text-neutral-500">Loading subscriptions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-neutral-600">{error}</p>
        <Button variant="ghost" size="sm" onClick={fetchSubscriptions}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const filtered =
    planFilter === "all"
      ? subscriptions
      : subscriptions.filter((s) => s.plan === planFilter);

  const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  // Estimate monthly revenue from active subscriptions
  const monthlyRevenue = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      if (s.plan === "premium_3") return sum + s.amount / 3;
      if (s.plan === "premium_6") return sum + s.amount / 6;
      if (s.plan === "premium_12") return sum + s.amount / 12;
      return sum;
    }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Subscriptions</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Monitor revenue and subscription activity
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchSubscriptions}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={`\u20B9${totalRevenue.toLocaleString("en-IN")}`}
          iconClassName="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon={Crown}
          label="Active Subscribers"
          value={activeCount}
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Est. Monthly Revenue"
          value={`\u20B9${Math.round(monthlyRevenue).toLocaleString("en-IN")}`}
          trend={{ value: "from active subs", positive: true }}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "premium_3", "premium_6", "premium_12"].map((plan) => (
          <button
            key={plan}
            onClick={() => setPlanFilter(plan)}
            className={`rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors ${
              planFilter === plan
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {plan === "all" ? "All Plans" : PLAN_LABELS[plan]}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className="hidden sm:table-cell">Start Date</TableHead>
            <TableHead className="hidden sm:table-cell">End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Amount</TableHead>
            <TableHead className="hidden lg:table-cell">Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-neutral-500">
                No subscriptions found.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium text-neutral-900">
                  {sub.userName}
                </TableCell>
                <TableCell>
                  <Badge variant="primary" size="sm">
                    {PLAN_LABELS[sub.plan]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-neutral-500">
                  {new Date(sub.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-neutral-500">
                  {new Date(sub.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sub.status === "active"
                        ? "success"
                        : sub.status === "expired"
                          ? "default"
                          : "error"
                    }
                    size="sm"
                  >
                    {sub.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell font-medium">
                  {"\u20B9"}{sub.amount.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-neutral-500">
                  {sub.paymentMethod}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
