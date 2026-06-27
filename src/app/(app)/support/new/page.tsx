"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ArrowLeft, Send, Crown, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "account",   label: "Account & Login" },
  { value: "payment",   label: "Payment & Billing" },
  { value: "profile",   label: "Profile Issues" },
  { value: "match",     label: "Matches & Interests" },
  { value: "technical", label: "Technical Problem" },
  { value: "other",     label: "Other" },
];

const FREE_PRIORITIES  = [{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }];
const PREM_PRIORITIES  = [
  { value: "low", label: "Low" }, { value: "normal", label: "Normal" },
  { value: "high", label: "High ⚡" }, { value: "urgent", label: "Urgent 🚨" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const { isPremium } = useCurrentUser();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState(isPremium ? "high" : "normal");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const priorities = isPremium ? PREM_PRIORITIES : FREE_PRIORITIES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Subject and description are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, priority, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      router.push(`/support/${data.ticket._id}?created=1`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/support" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to Support
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">New Support Ticket</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Describe your issue and our team will respond{isPremium ? " with priority" : ""}.
        </p>
      </div>

      {isPremium && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Crown className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Premium member — your ticket will be handled with <strong>High Priority</strong>.</span>
        </div>
      )}

      <Card variant="flat" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-[var(--radius-md)] px-3 py-2">{error}</p>
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              maxLength={120}
              required
              className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">
                Priority {!isPremium && <span className="text-neutral-400 font-normal">(High/Urgent requires Premium)</span>}
              </label>
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      "flex-1 h-10 rounded-[var(--radius-md)] border text-xs font-medium transition-colors",
                      priority === p.value
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">
              Description * <span className="text-neutral-400 font-normal">(be as detailed as possible)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, or relevant context..."
              rows={6}
              required
              maxLength={2000}
              className="w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none resize-y"
            />
            <p className="text-xs text-neutral-400 text-right">{description.length}/2000</p>
          </div>

          <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full sm:w-auto">
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              : <><Send className="h-4 w-4" /> Submit Ticket</>}
          </Button>
        </form>
      </Card>
    </div>
  );
}
