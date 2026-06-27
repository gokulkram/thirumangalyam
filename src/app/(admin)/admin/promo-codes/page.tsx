"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Loader2, AlertCircle, RefreshCw, Tag,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PromoCodeRecord {
  _id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  applicablePlans: string[];
  description: string;
  createdAt: string;
}

const PLAN_LABELS: Record<string, string> = {
  premium_3: "3 Months",
  premium_6: "6 Months",
  premium_12: "12 Months",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "",
    maxUses: "",
    expiresAt: "",
    description: "",
    applicablePlans: [] as string[],
  });

  async function fetchCodes() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/promo-codes");
      if (!res.ok) throw new Error("Failed to load promo codes");
      const data = await res.json();
      setCodes(data.codes || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCodes(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) return;
    try {
      setSaving(true);
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
          applicablePlans: form.applicablePlans,
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create code");
      setMsg("Promo code created successfully");
      setShowForm(false);
      setForm({ code: "", discountType: "percent", discountValue: "", maxUses: "", expiresAt: "", description: "", applicablePlans: [] });
      await fetchCodes();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await fetch("/api/admin/promo-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      setCodes((prev) => prev.map((c) => c._id === id ? { ...c, isActive } : c));
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete promo code "${code}"?`)) return;
    try {
      await fetch("/api/admin/promo-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setCodes((prev) => prev.filter((c) => c._id !== id));
      setMsg("Promo code deleted");
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    }
  }

  function togglePlan(plan: string) {
    setForm((f) => ({
      ...f,
      applicablePlans: f.applicablePlans.includes(plan)
        ? f.applicablePlans.filter((p) => p !== plan)
        : [...f.applicablePlans, plan],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Promo Codes</h1>
          <p className="text-sm text-neutral-500 mt-1">{codes.length} total codes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchCodes}><RefreshCw className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Create Code
          </Button>
        </div>
      </div>

      {msg && (
        <div className={cn(
          "flex items-center justify-between rounded-[var(--radius-md)] border px-4 py-2.5 text-sm",
          msg.startsWith("Error") ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
        )}>
          {msg}
          <button onClick={() => setMsg(null)} className="ml-4 text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">New Promo Code</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                required
                className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm uppercase focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Discount Type *</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as any }))}
                className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">
                Discount Value * {form.discountType === "percent" ? "(%)" : "(₹)"}
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === "percent" ? "e.g. 20" : "e.g. 500"}
                min={1}
                max={form.discountType === "percent" ? 100 : undefined}
                required
                className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="e.g. 100"
                min={1}
                className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Expiry Date (blank = never)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Description (shown to user)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Introductory offer — 20% off"
                className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Applicable Plans (blank = all)</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PLAN_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePlan(key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    form.applicablePlans.includes(key)
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white text-neutral-600 border-neutral-300 hover:border-rose-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Creating..." : "Create Code"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
          <span className="ml-3 text-neutral-500">Loading codes...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-neutral-600">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchCodes}>Retry</Button>
        </div>
      ) : codes.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-neutral-400 rounded-[var(--radius-lg)] border border-neutral-200 bg-white">
          <Tag className="h-10 w-10" />
          <p>No promo codes yet. Create one above.</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Usage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Plans</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {codes.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const maxed = c.maxUses !== null && c.usedCount >= c.maxUses;
                return (
                  <tr key={c._id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-neutral-900">{c.code}</p>
                      {c.description && <p className="text-xs text-neutral-400 mt-0.5">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="premium" size="sm">
                        {c.discountType === "percent" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-neutral-600">
                      {c.usedCount} / {c.maxUses ?? "∞"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-neutral-500">
                      {c.expiresAt ? (
                        <span className={cn(expired && "text-red-500")}>{fmt(c.expiresAt)}</span>
                      ) : "Never"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {c.applicablePlans.length === 0 ? (
                        <span className="text-xs text-neutral-400">All</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {c.applicablePlans.map((p) => (
                            <span key={p} className="text-xs bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5">
                              {PLAN_LABELS[p] || p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {expired || maxed ? (
                        <Badge variant="error" size="sm">{expired ? "Expired" : "Maxed"}</Badge>
                      ) : (
                        <button
                          onClick={() => handleToggle(c._id, !c.isActive)}
                          className="flex items-center justify-center mx-auto"
                          title={c.isActive ? "Deactivate" : "Activate"}
                        >
                          {c.isActive
                            ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                            : <ToggleLeft className="h-5 w-5 text-neutral-400" />}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(c._id, c.code)}
                        className="p-1.5 rounded-[var(--radius-sm)] hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
