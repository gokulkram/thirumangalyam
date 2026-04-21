"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Ban,
  PauseCircle,
  PlayCircle,
  Crown,
  Flag,
  Eye,
  Heart,
  Send,
  Inbox,
  Globe,
  Users,
  Clock,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Avatar,
  Progress,
} from "@/components/ui";
import { EmptyState } from "@/components/ui";
import { StatCard } from "@/components/domain/stat-card";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "error" | "default"; label: string }> = {
  active: { variant: "success" as const, label: "Active" },
  suspended: { variant: "warning" as const, label: "Suspended" },
  banned: { variant: "error" as const, label: "Banned" },
  inactive: { variant: "default" as const, label: "Inactive" },
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  premium_3: "Premium 3M",
  premium_6: "Premium 6M",
  premium_12: "Premium 12M",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-neutral-100 text-neutral-700",
  premium_3: "bg-blue-50 text-blue-700",
  premium_6: "bg-violet-50 text-violet-700",
  premium_12: "bg-amber-50 text-amber-700",
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = await res.json();
      setUser(data.user || data);
      setUserReports(data.reports || []);
      setUserSubscriptions(data.subscriptions || []);
      setUserActivity(data.activityLog || []);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleAction = async (action: "suspend" | "ban" | "activate" | "make_premium" | "downgrade") => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        console.error("Action failed:", await res.text());
        return;
      }
      await fetchUser();
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <EmptyState
        title="User not found"
        description="The user you're looking for doesn't exist or has been removed."
        action={{ label: "Back to Users", href: "/admin/users" }}
      />
    );
  }

  const status = STATUS_BADGE[user.status] || STATUS_BADGE.inactive;
  const isPaid = user.plan !== "free";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Avatar name={user.fullName} size="xl" src={user.primaryPhotoUrl} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">{user.fullName}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
            {user.isVerified && (
              <Badge variant="success" size="sm">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Badge>
            )}
            <Badge size="md" className={PLAN_COLORS[user.plan]}>
              {isPaid && <Crown className="h-3 w-3" />}
              {PLAN_LABELS[user.plan]}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> {user.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {user.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Joined{" "}
              {new Date(user.joinedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Last active{" "}
              {new Date(user.lastActive).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> {user.lastLoginIp}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-neutral-100">
        {user.status !== "active" && (
          <Button variant="secondary" size="sm" disabled={actionLoading !== null} onClick={() => handleAction("activate")}>
            <PlayCircle className="h-4 w-4" />
            {actionLoading === "activate" ? "Activating..." : "Activate"}
          </Button>
        )}
        {user.status === "active" && (
          <Button variant="ghost" size="sm" disabled={actionLoading !== null} onClick={() => handleAction("suspend")}>
            <PauseCircle className="h-4 w-4" />
            {actionLoading === "suspend" ? "Suspending..." : "Suspend"}
          </Button>
        )}
        {user.status !== "banned" && (
          <Button variant="destructive" size="sm" disabled={actionLoading !== null} onClick={() => handleAction("ban")}>
            <Ban className="h-4 w-4" />
            {actionLoading === "ban" ? "Banning..." : "Ban User"}
          </Button>
        )}
        {user.plan === "free" ? (
          <Button variant="ghost" size="sm" disabled={actionLoading !== null} onClick={() => handleAction("make_premium")}>
            <Crown className="h-4 w-4" />
            {actionLoading === "make_premium" ? "Upgrading..." : "Upgrade to Premium"}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled={actionLoading !== null} onClick={() => handleAction("downgrade")}>
            <Users className="h-4 w-4" />
            {actionLoading === "downgrade" ? "Downgrading..." : "Downgrade to Free"}
          </Button>
        )}
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Eye}
          label="Profile Views"
          value={user.profileViews}
          iconClassName="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon={Inbox}
          label="Interests Received"
          value={user.interestsReceived}
          iconClassName="bg-rose-50 text-rose-600"
        />
        <StatCard
          icon={Send}
          label="Interests Sent"
          value={user.interestsSent}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Profile Completion"
          value={`${user.profileComplete}%`}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                { label: "Full Name", value: user.fullName },
                { label: "Gender", value: user.gender === "male" ? "Male" : "Female" },
                { label: "Age", value: `${user.age} years` },
                { label: "Community", value: user.community },
                { label: "Location", value: user.location },
                { label: "Email", value: user.email },
                { label: "Phone", value: user.phone },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <dt className="text-neutral-500">{label}</dt>
                  <dd className="font-medium text-neutral-900 text-right">{value}</dd>
                </div>
              ))}
              <div className="pt-2 border-t border-neutral-100">
                <div className="flex justify-between text-sm mb-2">
                  <dt className="text-neutral-500">Profile Completion</dt>
                  <dd className="font-medium text-neutral-900">{user.profileComplete}%</dd>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      user.profileComplete >= 80 ? "bg-emerald-500" :
                      user.profileComplete >= 50 ? "bg-amber-500" : "bg-red-400"
                    )}
                    style={{ width: `${user.profileComplete}%` }}
                  />
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Subscription & Plan Details */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Current Plan */}
            <div className={cn(
              "rounded-[var(--radius-md)] p-4 mb-4",
              isPaid ? "bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200" : "bg-neutral-50 border border-neutral-200"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Current Plan</p>
                  <p className={cn("text-lg font-bold mt-0.5", isPaid ? "text-amber-800" : "text-neutral-700")}>
                    {PLAN_LABELS[user.plan]}
                  </p>
                </div>
                {isPaid ? (
                  <Crown className="h-8 w-8 text-amber-500" />
                ) : (
                  <Users className="h-8 w-8 text-neutral-400" />
                )}
              </div>
              {!isPaid && (
                <p className="text-xs text-neutral-500 mt-2">
                  This user has not upgraded to a paid plan yet.
                </p>
              )}
            </div>

            {/* Subscription History */}
            {userSubscriptions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Subscription History</p>
                {userSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-[var(--radius-md)] border border-neutral-200 p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="primary" size="sm">{PLAN_LABELS[sub.plan]}</Badge>
                        <Badge
                          variant={sub.status === "active" ? "success" : sub.status === "expired" ? "default" : "error"}
                          size="sm"
                        >
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(sub.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {" — "}
                        {new Date(sub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900">₹{sub.amount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-neutral-400">{sub.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No subscription history.</p>
            )}
          </CardContent>
        </Card>

        {/* Reports */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-rose-500" />
              Reports ({userReports.length})
            </CardTitle>
            <CardDescription>
              {user.reportsCount > 0
                ? `${user.reportsCount} report(s) filed against this user`
                : "Clean record — no reports"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userReports.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-400 mb-3">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-sm text-neutral-500">No reports associated with this user.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-[var(--radius-md)] border border-neutral-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            report.status === "open" ? "warning" :
                            report.status === "resolved" ? "success" : "default"
                          }
                          size="sm"
                        >
                          {report.status}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {report.reason.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <span className="text-xs text-neutral-400">
                        {new Date(report.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-neutral-700">
                      {report.description}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {report.reportedUserId === userId
                        ? `Reported by ${report.reportedByUserName}`
                        : `Reported ${report.reportedUserName}`}
                    </p>
                    {report.resolution && (
                      <div className="mt-2 rounded bg-emerald-50 p-2 text-xs text-emerald-700">
                        Resolution: {report.resolution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userActivity.length === 0 ? (
              <p className="text-sm text-neutral-500">No recent activity for this user.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-neutral-200" />
                <div className="space-y-4">
                  {userActivity.map((entry) => (
                    <div key={entry.id} className="flex gap-3 relative">
                      <div className={cn(
                        "mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 border-white z-10",
                        entry.action.includes("ban") ? "bg-red-400" :
                        entry.action.includes("report") ? "bg-amber-400" :
                        entry.action.includes("subscription") || entry.action.includes("premium") ? "bg-emerald-400" :
                        entry.action.includes("verification") ? "bg-blue-400" :
                        "bg-neutral-300"
                      )} />
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-sm text-neutral-700">{entry.description}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {new Date(entry.timestamp).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge size="sm" variant="default">
                        {entry.action.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Dates */}
            <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Key Dates</p>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Registered</span>
                <span className="font-medium text-neutral-900">
                  {new Date(user.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Last Active</span>
                <span className="font-medium text-neutral-900">
                  {new Date(user.lastActive).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Last Login IP</span>
                <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                  {user.lastLoginIp}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
