"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Flag,
  AlertTriangle,
  Ban,
  PauseCircle,
  XCircle,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui";
import type { Report, ReportReason } from "@/types/admin";

const REASON_LABELS: Record<ReportReason, string> = {
  fake_profile: "Fake Profile",
  inappropriate_photos: "Inappropriate Photos",
  harassment: "Harassment",
  spam: "Spam",
  underage: "Underage",
  other: "Other",
};

const REASON_VARIANT: Record<ReportReason, "error" | "warning" | "default"> = {
  fake_profile: "error",
  inappropriate_photos: "error",
  harassment: "error",
  spam: "warning",
  underage: "error",
  other: "default",
};

function ReportCard({
  report,
  onResolve,
  onDismiss,
  onBanUser,
  onSuspendUser,
  actionLoading,
}: {
  report: Report;
  onResolve: (resolution: string) => void;
  onDismiss: () => void;
  onBanUser: () => void;
  onSuspendUser: () => void;
  actionLoading: boolean;
}) {
  const [resolution, setResolution] = useState("");

  return (
    <Card variant="flat" padding="md">
      <CardContent>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={REASON_VARIANT[report.reason]} size="sm">
                {REASON_LABELS[report.reason]}
              </Badge>
              <Badge
                variant={
                  report.status === "open"
                    ? "warning"
                    : report.status === "resolved"
                      ? "success"
                      : "default"
                }
                size="sm"
              >
                {report.status}
              </Badge>
            </div>
            <span className="text-xs text-neutral-400 shrink-0">
              {new Date(report.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Content */}
          <div className="text-sm">
            <p className="text-neutral-700">{report.description}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-500">
              <span>
                <span className="font-medium text-neutral-700">Reported:</span>{" "}
                {report.reportedUserName}
              </span>
              <span>
                <span className="font-medium text-neutral-700">By:</span>{" "}
                {report.reportedByUserName}
              </span>
            </div>
          </div>

          {report.resolution && (
            <div className="rounded-[var(--radius-md)] bg-emerald-50 p-2 text-xs text-emerald-700">
              Resolution: {report.resolution}
            </div>
          )}

          {/* Actions */}
          {report.status === "open" && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSuspendUser}
                disabled={actionLoading}
              >
                <PauseCircle className="h-4 w-4" />
                Suspend User
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onBanUser}
                disabled={actionLoading}
              >
                <Ban className="h-4 w-4" />
                Ban User
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading}>
                    <CheckCircle className="h-4 w-4" />
                    Resolve
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Resolve Report</DialogTitle>
                    <DialogDescription>
                      Add a resolution note for this report.
                    </DialogDescription>
                  </DialogHeader>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Enter resolution..."
                    className="w-full h-24 rounded-[var(--radius-md)] border border-neutral-300 p-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none resize-none"
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost" size="sm">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          onResolve(resolution || "Reviewed and resolved");
                          setResolution("");
                        }}
                      >
                        Confirm
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                disabled={actionLoading}
              >
                <XCircle className="h-4 w-4" />
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      const json = await res.json();
      setReports(json.reports || json || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleResolve(id: string, resolution: string) {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", resolution }),
      });
      if (!res.ok) throw new Error("Failed to resolve report");
      await fetchReports();
    } catch (err: any) {
      setActionError(err.message || "Failed to resolve report");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDismiss(id: string) {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      if (!res.ok) throw new Error("Failed to dismiss report");
      await fetchReports();
    } catch (err: any) {
      setActionError(err.message || "Failed to dismiss report");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBanUser(reportId: string, userId: string) {
    try {
      setActionLoading(reportId);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ban" }),
      });
      if (!res.ok) throw new Error("Failed to ban user");
      await fetchReports();
    } catch (err: any) {
      setActionError(err.message || "Failed to ban user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSuspendUser(reportId: string, userId: string) {
    try {
      setActionLoading(reportId);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend" }),
      });
      if (!res.ok) throw new Error("Failed to suspend user");
      await fetchReports();
    } catch (err: any) {
      setActionError(err.message || "Failed to suspend user");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-3 text-neutral-500">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-neutral-600">{error}</p>
        <Button variant="ghost" size="sm" onClick={fetchReports}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const open = reports.filter((r) => r.status === "open");
  const resolved = reports.filter((r) => r.status === "resolved");
  const dismissed = reports.filter((r) => r.status === "dismissed");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Review and moderate user reports
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchReports}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700 flex-1">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Dismiss</button>
        </div>
      )}

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">
            Open
            {open.length > 0 && (
              <Badge variant="error" size="sm" className="ml-2">
                {open.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          {open.length === 0 ? (
            <div className="py-12 text-center">
              <Flag className="h-12 w-12 mx-auto text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">No open reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {open.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onResolve={(resolution) => handleResolve(report.id, resolution)}
                  onDismiss={() => handleDismiss(report.id)}
                  onBanUser={() => handleBanUser(report.id, report.reportedUserId)}
                  onSuspendUser={() => handleSuspendUser(report.id, report.reportedUserId)}
                  actionLoading={actionLoading === report.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved">
          {resolved.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">No resolved reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resolved.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onResolve={() => {}}
                  onDismiss={() => {}}
                  onBanUser={() => {}}
                  onSuspendUser={() => {}}
                  actionLoading={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dismissed">
          {dismissed.length === 0 ? (
            <div className="py-12 text-center">
              <XCircle className="h-12 w-12 mx-auto text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">No dismissed reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dismissed.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onResolve={() => {}}
                  onDismiss={() => {}}
                  onBanUser={() => {}}
                  onSuspendUser={() => {}}
                  actionLoading={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
