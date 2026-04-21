"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  ShieldCheck,
  Flag,
  IndianRupee,
  UserPlus,
  Crown,
  TrendingUp,
  UserX,
  Eye,
  Heart,
  ArrowUpRight,
  Percent,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { StatCard } from "@/components/domain/stat-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
} from "@/components/ui";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  AdminStats,
  ActivityLogEntry,
  UserRecord,
} from "@/types/admin";

interface DashboardData {
  stats: AdminStats;
  activityLog: ActivityLogEntry[];
  users: UserRecord[];
  pendingVerificationsCount: number;
  openReportsCount: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-3 text-neutral-500">Loading dashboard...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-neutral-600">{error || "Failed to load dashboard"}</p>
        <Button variant="ghost" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const { stats, activityLog, users, pendingVerificationsCount, openReportsCount } = data;

  // Compute live user breakdowns from fetched data
  const freeUsers = users.filter((u) => u.plan === "free");
  const paidUsers = users.filter((u) => u.plan !== "free");
  const premium3Users = users.filter((u) => u.plan === "premium_3");
  const premium6Users = users.filter((u) => u.plan === "premium_6");
  const premium12Users = users.filter((u) => u.plan === "premium_12");
  const maleUsers = users.filter((u) => u.gender === "male");
  const femaleUsers = users.filter((u) => u.gender === "female");
  const verifiedUsers = users.filter((u) => u.isVerified);
  const activeUsers = users.filter((u) => u.status === "active");
  const suspendedUsers = users.filter((u) => u.status === "suspended");
  const bannedUsers = users.filter((u) => u.status === "banned");
  const inactiveUsers = users.filter((u) => u.status === "inactive");

  // Community breakdown
  const communityMap = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.community] = (acc[u.community] || 0) + 1;
    return acc;
  }, {});
  const topCommunities = Object.entries(communityMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  // Location breakdown
  const locationMap = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.location] = (acc[u.location] || 0) + 1;
    return acc;
  }, {});
  const topLocations = Object.entries(locationMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  // Recent joiners (last 5)
  const recentJoiners = [...users]
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
    .slice(0, 5);

  // Top engaged users (by profile views)
  const topEngaged = [...users]
    .sort((a, b) => b.profileViews - a.profileViews)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Overview of your platform — {users.length} users in system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchDashboard}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users">View All Users</Link>
          </Button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers.toLocaleString("en-IN")}
          trend={{ value: "12%", positive: true }}
        />
        <StatCard
          icon={UserCheck}
          label="Active Today"
          value={stats.activeToday.toLocaleString("en-IN")}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={Crown}
          label="Premium Users"
          value={stats.totalPremiumUsers.toLocaleString("en-IN")}
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={UserPlus}
          label="Free Users"
          value={stats.freeUsers.toLocaleString("en-IN")}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={ShieldCheck}
          label="Pending Verify"
          value={pendingVerificationsCount}
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={Flag}
          label="Open Reports"
          value={openReportsCount}
          iconClassName="bg-red-50 text-red-600"
        />
      </div>

      {/* Revenue + Conversion Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={IndianRupee}
          label="Monthly Revenue"
          value={`\u20B9${stats.monthlyRevenue.toLocaleString("en-IN")}`}
          trend={{ value: "8% vs last month", positive: true }}
          iconClassName="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon={Percent}
          label="Free \u2192 Paid Rate"
          value={`${stats.conversionRate}%`}
          trend={{ value: "2.1% vs last month", positive: true }}
          iconClassName="bg-teal-50 text-teal-600"
        />
        <StatCard
          icon={UserPlus}
          label="New This Week"
          value={stats.newUsersThisWeek}
          trend={{ value: "23 more than last week", positive: true }}
          iconClassName="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Free vs Paid Breakdown + Gender + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              Plan Distribution
            </CardTitle>
            <CardDescription>Free vs paid user breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Visual bar */}
              <div className="flex h-8 rounded-full overflow-hidden">
                <div
                  className="bg-neutral-300 flex items-center justify-center text-[10px] font-bold text-neutral-700"
                  style={{ width: `${users.length > 0 ? (freeUsers.length / users.length) * 100 : 0}%` }}
                >
                  {freeUsers.length}
                </div>
                <div
                  className="bg-blue-400 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${users.length > 0 ? (premium3Users.length / users.length) * 100 : 0}%` }}
                >
                  {premium3Users.length}
                </div>
                <div
                  className="bg-violet-500 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${users.length > 0 ? (premium6Users.length / users.length) * 100 : 0}%` }}
                >
                  {premium6Users.length}
                </div>
                <div
                  className="bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${users.length > 0 ? (premium12Users.length / users.length) * 100 : 0}%` }}
                >
                  {premium12Users.length}
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {[
                  { label: "Free", count: freeUsers.length, color: "bg-neutral-300", pct: users.length > 0 ? ((freeUsers.length / users.length) * 100).toFixed(1) : "0" },
                  { label: "Premium 3M", count: premium3Users.length, color: "bg-blue-400", pct: users.length > 0 ? ((premium3Users.length / users.length) * 100).toFixed(1) : "0" },
                  { label: "Premium 6M", count: premium6Users.length, color: "bg-violet-500", pct: users.length > 0 ? ((premium6Users.length / users.length) * 100).toFixed(1) : "0" },
                  { label: "Premium 12M", count: premium12Users.length, color: "bg-amber-500", pct: users.length > 0 ? ((premium12Users.length / users.length) * 100).toFixed(1) : "0" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", item.color)} />
                      <span className="text-neutral-600">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-neutral-900">{item.count}</span>
                      <span className="text-xs text-neutral-400 w-12 text-right">{item.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-100">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Total Paid</span>
                  <span className="font-bold text-neutral-900">{paidUsers.length} users</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gender Split */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-rose-500" />
              Gender Split
            </CardTitle>
            <CardDescription>Male vs female ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Visual donut-like display */}
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 border-4 border-blue-400">
                    <span className="text-lg font-bold text-blue-700">{maleUsers.length}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-neutral-600">Male</p>
                  <p className="text-xs text-neutral-400">
                    {users.length > 0 ? ((maleUsers.length / users.length) * 100).toFixed(1) : "0"}%
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 border-4 border-rose-400">
                    <span className="text-lg font-bold text-rose-700">{femaleUsers.length}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-neutral-600">Female</p>
                  <p className="text-xs text-neutral-400">
                    {users.length > 0 ? ((femaleUsers.length / users.length) * 100).toFixed(1) : "0"}%
                  </p>
                </div>
              </div>

              {/* Premium by gender */}
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Premium by Gender</p>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Male Premium</span>
                  <span className="font-semibold">{maleUsers.filter((u) => u.plan !== "free").length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Female Premium</span>
                  <span className="font-semibold">{femaleUsers.filter((u) => u.plan !== "free").length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Status */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              User Status
            </CardTitle>
            <CardDescription>Account status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Active", count: activeUsers.length, variant: "success" as const, icon: UserCheck },
                { label: "Suspended", count: suspendedUsers.length, variant: "warning" as const, icon: UserX },
                { label: "Banned", count: bannedUsers.length, variant: "error" as const, icon: UserX },
                { label: "Inactive", count: inactiveUsers.length, variant: "default" as const, icon: UserX },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <Badge variant={item.variant} size="md" className="w-24 justify-center">
                      {item.label}
                    </Badge>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", {
                            "bg-emerald-500": item.variant === "success",
                            "bg-amber-500": item.variant === "warning",
                            "bg-red-500": item.variant === "error",
                            "bg-neutral-400": item.variant === "default",
                          })}
                          style={{ width: `${users.length > 0 ? (item.count / users.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                );
              })}

              {/* Verified status */}
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Verification</p>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Verified</span>
                  <span className="font-semibold text-emerald-600">{verifiedUsers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Unverified</span>
                  <span className="font-semibold text-neutral-600">{users.length - verifiedUsers.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Communities + Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle>Top Communities</CardTitle>
            <CardDescription>User distribution by community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCommunities.map(([community, count]) => (
                <div key={community} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-700 w-24 shrink-0">{community}</span>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-400"
                        style={{ width: `${users.length > 0 ? (count / users.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>User distribution by city</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLocations.map(([location, count]) => (
                <div key={location} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-700 w-24 shrink-0">{location}</span>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-400"
                        style={{ width: `${users.length > 0 ? (count / users.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Joiners + Top Engaged + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Joiners */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-500" />
              Recent Joiners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentJoiners.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-3 text-sm rounded-[var(--radius-md)] p-2 -mx-2 hover:bg-neutral-50 transition-colors"
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0",
                    user.gender === "male" ? "bg-blue-400" : "bg-rose-400"
                  )}>
                    {user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">{user.fullName}</p>
                    <p className="text-xs text-neutral-400">
                      {new Date(user.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {" \u00B7 "}
                      {user.location}
                    </p>
                  </div>
                  <Badge
                    variant={user.plan === "free" ? "default" : "primary"}
                    size="sm"
                  >
                    {user.plan === "free" ? "Free" : "Paid"}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Engaged */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-violet-500" />
              Most Viewed Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEngaged.map((user, index) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-3 text-sm rounded-[var(--radius-md)] p-2 -mx-2 hover:bg-neutral-50 transition-colors"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">{user.fullName}</p>
                    <p className="text-xs text-neutral-400">
                      {user.profileViews} views \u00B7 {user.interestsReceived} interests
                    </p>
                  </div>
                  {user.plan !== "free" && (
                    <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions + Activity */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="ghost" size="sm" fullWidth className="justify-start" asChild>
                <Link href="/admin/verifications">
                  <ShieldCheck className="h-4 w-4" />
                  Review Verifications
                  <Badge variant="warning" size="sm" className="ml-auto">{pendingVerificationsCount}</Badge>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" fullWidth className="justify-start" asChild>
                <Link href="/admin/reports">
                  <Flag className="h-4 w-4" />
                  Handle Reports
                  <Badge variant="error" size="sm" className="ml-auto">{openReportsCount}</Badge>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" fullWidth className="justify-start" asChild>
                <Link href="/admin/users?plan=free">
                  <Users className="h-4 w-4" />
                  View Free Users
                  <ArrowUpRight className="h-3 w-3 ml-auto text-neutral-400" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" fullWidth className="justify-start" asChild>
                <Link href="/admin/users?plan=paid">
                  <Crown className="h-4 w-4" />
                  View Paid Users
                  <ArrowUpRight className="h-3 w-3 ml-auto text-neutral-400" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" fullWidth className="justify-start" asChild>
                <Link href="/admin/subscriptions">
                  <IndianRupee className="h-4 w-4" />
                  Subscription Revenue
                  <ArrowUpRight className="h-3 w-3 ml-auto text-neutral-400" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card variant="flat" padding="lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activityLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 text-sm"
              >
                <div className={cn(
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  entry.action.includes("ban") ? "bg-red-400" :
                  entry.action.includes("report") ? "bg-amber-400" :
                  entry.action.includes("subscription") || entry.action.includes("premium") ? "bg-emerald-400" :
                  entry.action.includes("verification") ? "bg-blue-400" :
                  "bg-rose-400"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-700">
                    <span className="font-medium">{entry.userName}</span>{" "}
                    — {entry.description}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(entry.timestamp).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge size="sm" variant={
                  entry.action.includes("ban") ? "error" :
                  entry.action.includes("report") ? "warning" :
                  entry.action.includes("subscription") || entry.action.includes("premium") ? "success" :
                  "default"
                }>
                  {entry.action.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
