"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

type Segment = "all" | "free" | "premium" | "inactive_30d" | "inactive_60d" | "unverified";

const SEGMENTS: { value: Segment; label: string; description: string }[] = [
  { value: "all",          label: "All Active Users",    description: "Every active member on the platform" },
  { value: "free",         label: "Free Users",          description: "Active users on the free plan" },
  { value: "premium",      label: "Premium Users",       description: "Active paying subscribers" },
  { value: "inactive_30d", label: "Inactive 30+ Days",   description: "Active accounts with no recent activity" },
  { value: "inactive_60d", label: "Inactive 60+ Days",   description: "Long-inactive accounts for re-engagement" },
  { value: "unverified",   label: "Unverified Users",    description: "Active users who haven't verified their profile" },
];

interface Result { sent: number; failed: number; total: number }

export default function EmailCampaignsPage() {
  const [segment, setSegment] = useState<Segment>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingCount, setLoadingCount] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Fetch recipient count when segment changes
  useEffect(() => {
    let cancelled = false;
    async function fetchCount() {
      setLoadingCount(true);
      setPreviewCount(null);
      try {
        const res = await fetch(`/api/admin/email-campaign?segment=${segment}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPreviewCount(data.total ?? 0);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingCount(false);
      }
    }
    fetchCount();
    return () => { cancelled = true; };
  }, [segment]);

  async function handleSend() {
    setConfirmOpen(false);
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    try {
      setSending(true);
      setError(null);
      setResult(null);
      const res = await fetch("/api/admin/email-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html: bodyToHtml(body), segment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send campaign");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  function bodyToHtml(text: string) {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const withLinks = escaped.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" style="color:#D64545;">$1</a>'
    );
    const paragraphs = withLinks
      .split(/\n\n+/)
      .map((p) => `<p style="margin:0 0 12px 0">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#D64545;color:white;padding:20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;">${APP_NAME}</h2>
  </div>
  <div style="border:1px solid #e5e5e5;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    ${paragraphs}
  </div>
  <p style="font-size:11px;color:#999;margin-top:12px;text-align:center;">
    You are receiving this email as a registered member of ${APP_NAME}.
  </p>
</div>`;
  }

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !sending;
  const segmentLabel = SEGMENTS.find((s) => s.value === segment)?.label ?? segment;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Email Campaigns</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Compose and send bulk emails to user segments
        </p>
      </div>

      {/* Result banner */}
      {result && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">Campaign sent!</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              {result.sent} of {result.total} emails delivered.
              {result.failed > 0 && ` ${result.failed} failed.`}
            </p>
          </div>
          <button onClick={() => setResult(null)} className="text-emerald-400 hover:text-emerald-600 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="flex-1 text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Compose</h2>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Subject</label>
              <input
                type="text"
                placeholder="Email subject line..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">Message</label>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {previewMode ? "Edit" : "Preview"}
                </button>
              </div>

              {previewMode ? (
                <div
                  className="min-h-48 rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: bodyToHtml(body) }}
                />
              ) : (
                <textarea
                  placeholder="Write your message here. Use blank lines to create paragraphs. URLs are automatically linked."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none resize-y"
                />
              )}
              <p className="text-xs text-neutral-400">{body.length} characters</p>
            </div>
          </div>
        </div>

        {/* Segment + send panel */}
        <div className="space-y-4">
          {/* Segment selector */}
          <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Audience</h2>
            <div className="space-y-2">
              {SEGMENTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSegment(s.value)}
                  className={cn(
                    "w-full text-left rounded-[var(--radius-md)] border px-3 py-2.5 transition-colors",
                    segment === s.value
                      ? "border-rose-300 bg-rose-50"
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                  )}
                >
                  <p className={cn("text-sm font-medium", segment === s.value ? "text-rose-700" : "text-neutral-800")}>
                    {s.label}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient count */}
          <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-semibold text-neutral-700">Recipients</span>
            </div>
            {loadingCount ? (
              <div className="flex items-center gap-2 text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Counting...</span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-neutral-900">{previewCount?.toLocaleString() ?? "—"}</p>
            )}
            <p className="text-xs text-neutral-500 mt-1">{segmentLabel} with email address</p>
          </div>

          {/* Send button */}
          {!confirmOpen ? (
            <Button
              className="w-full"
              disabled={!canSend || (previewCount !== null && previewCount === 0)}
              onClick={() => setConfirmOpen(true)}
            >
              <Send className="h-4 w-4" />
              Send Campaign
            </Button>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-800">Confirm send?</p>
              <p className="text-sm text-amber-700">
                This will send <strong>"{subject}"</strong> to{" "}
                <strong>{previewCount?.toLocaleString()} {segmentLabel}</strong> users. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? "Sending..." : "Confirm"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmOpen(false)}
                  disabled={sending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {previewCount === 0 && (
            <p className="text-xs text-center text-neutral-400">
              No users with email addresses in this segment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
