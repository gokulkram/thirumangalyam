"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Phone,
  Mail,
  User,
  Ban,
  PauseCircle,
  Crown,
} from "lucide-react";
import { Button, Badge, Avatar, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { cn } from "@/lib/utils";

interface DupeUser {
  id: string;
  fullName: string;
  city: string;
  community: string;
  status: string;
  plan: string;
  createdAt: string;
  primaryPhoto: string | null;
}

interface DupeGroup {
  key: string;
  count: number;
  users: DupeUser[];
}

interface DupeData {
  phoneDupes: DupeGroup[];
  emailDupes: DupeGroup[];
  nameDupes: DupeGroup[];
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-orange-100 text-orange-700",
  banned: "bg-red-100 text-red-700",
  inactive: "bg-neutral-100 text-neutral-600",
};

export default function DuplicateDetectionPage() {
  const [data, setData] = useState<DupeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/duplicate-detection");
      if (!res.ok) throw new Error("Failed to load duplicate data");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  async function handleAction(userId: string, action: "ban" | "suspend") {
    try {
      setActionLoading(userId);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: "Duplicate account detected" }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} user`);
      setActionMsg(`User ${action}ned successfully.`);
      await fetchData();
    } catch (e: any) {
      setActionMsg(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  function GroupCard({ group, type }: { group: DupeGroup; type: "phone" | "email" | "name" }) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white overflow-hidden">
        {/* Group header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border-b border-red-100">
          {type === "phone" && <Phone className="h-4 w-4 text-red-500" />}
          {type === "email" && <Mail className="h-4 w-4 text-red-500" />}
          {type === "name" && <User className="h-4 w-4 text-red-500" />}
          <span className="text-sm font-semibold text-neutral-800 flex-1 truncate">{group.key}</span>
          <span className="text-xs font-bold text-red-600 bg-red-100 rounded-full px-2 py-0.5">
            {group.count} accounts
          </span>
        </div>

        {/* Users in group */}
        <div className="divide-y divide-neutral-100">
          {group.users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={user.fullName} size="sm" src={user.primaryPhoto ?? undefined} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-sm font-medium text-neutral-900 hover:text-rose-600 hover:underline truncate"
                  >
                    {user.fullName}
                  </Link>
                  {user.plan !== "free" && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                </div>
                <p className="text-xs text-neutral-500 truncate">
                  {user.community} · {user.city}
                </p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[user.status] || STATUS_STYLE.inactive)}>
                {user.status}
              </span>
              <p className="text-xs text-neutral-400 shrink-0 hidden sm:block">
                {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
              </p>
              {user.status !== "banned" && (
                <div className="flex gap-1 shrink-0">
                  {user.status === "active" && (
                    <button
                      disabled={actionLoading === user.id}
                      onClick={() => handleAction(user.id, "suspend")}
                      className="p-1.5 rounded-[var(--radius-sm)] hover:bg-orange-50 text-orange-500 hover:text-orange-700 transition-colors"
                      title="Suspend"
                    >
                      <PauseCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    disabled={actionLoading === user.id}
                    onClick={() => handleAction(user.id, "ban")}
                    className="p-1.5 rounded-[var(--radius-sm)] hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    title="Ban"
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function GroupList({ groups, type }: { groups: DupeGroup[]; type: "phone" | "email" | "name" }) {
    if (!groups.length) {
      return (
        <div className="flex flex-col items-center py-12 gap-2 text-neutral-400">
          <ShieldAlert className="h-8 w-8" />
          <p className="text-sm">No duplicate {type}s found.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {groups.map((g) => (
          <GroupCard key={g.key} group={g} type={type} />
        ))}
      </div>
    );
  }

  const total = data
    ? data.phoneDupes.length + data.emailDupes.length + data.nameDupes.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Duplicate Detection</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Accounts sharing the same phone, email, or name
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          {actionMsg}
          <button onClick={() => setActionMsg(null)} className="ml-4 text-blue-400 hover:text-blue-600 text-xs font-medium">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <span className="ml-3 text-neutral-500">Scanning for duplicates...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-neutral-600">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Phone Duplicates", count: data!.phoneDupes.length, icon: Phone, color: "text-red-500" },
              { label: "Email Duplicates", count: data!.emailDupes.length, icon: Mail, color: "text-orange-500" },
              { label: "Name Duplicates", count: data!.nameDupes.length, icon: User, color: "text-amber-500" },
            ].map(({ label, count, icon: Icon, color }) => (
              <div key={label} className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("h-4 w-4", color)} />
                  <span className="text-xs text-neutral-500 font-medium">{label}</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{count}</p>
                <p className="text-xs text-neutral-400">
                  {count === 0 ? "No issues found" : `${count} group${count !== 1 ? "s" : ""} to review`}
                </p>
              </div>
            ))}
          </div>

          {total === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 rounded-[var(--radius-lg)] border border-neutral-200 bg-white">
              <ShieldAlert className="h-10 w-10 text-emerald-400" />
              <p className="font-semibold text-neutral-700">No duplicates detected</p>
              <p className="text-sm text-neutral-500">All accounts have unique phone numbers, emails, and names.</p>
            </div>
          ) : (
            <Tabs defaultValue="phone">
              <TabsList className="mb-4">
                <TabsTrigger value="phone">
                  Phone ({data!.phoneDupes.length})
                </TabsTrigger>
                <TabsTrigger value="email">
                  Email ({data!.emailDupes.length})
                </TabsTrigger>
                <TabsTrigger value="name">
                  Name ({data!.nameDupes.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="phone">
                <GroupList groups={data!.phoneDupes} type="phone" />
              </TabsContent>
              <TabsContent value="email">
                <GroupList groups={data!.emailDupes} type="email" />
              </TabsContent>
              <TabsContent value="name">
                <GroupList groups={data!.nameDupes} type="name" />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
