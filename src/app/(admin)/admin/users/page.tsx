"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  PauseCircle,
  Crown,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  ArrowUpDown,
  ArrowDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Avatar,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { exportToCSV } from "@/lib/export-csv";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { UserStatus, UserRecord } from "@/types/admin";

const STATUS_BADGE: Record<UserStatus, { variant: "success" | "warning" | "error" | "default"; label: string }> = {
  active: { variant: "success", label: "Active" },
  suspended: { variant: "warning", label: "Suspended" },
  banned: { variant: "error", label: "Banned" },
  inactive: { variant: "default", label: "Inactive" },
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  premium_3: "Premium 3M",
  premium_6: "Premium 6M",
  premium_12: "Premium 12M",
};

type SortKey = "name" | "joined" | "lastActive" | "profileViews" | "profileComplete";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 8;

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-neutral-500">Loading users...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}

function AdminUsersContent() {
  const searchParams = useSearchParams();

  // Initialize filters from URL params (for dashboard quick-links)
  const initialPlan = searchParams.get("plan") || "all";

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reason dialog state
  const [reasonDialog, setReasonDialog] = useState<{
    action: "ban" | "suspend";
    targets: string[];
    isBulk: boolean;
  } | null>(null);
  const [reasonText, setReasonText] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>(initialPlan);
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "1000"); // Fetch all for client-side filtering
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      setUsers(json.users || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleUserAction(userId: string, action: "ban" | "suspend" | "activate") {
    if (action === "ban" || action === "suspend") {
      setReasonText("");
      setReasonDialog({ action, targets: [userId], isBulk: false });
      return;
    }
    try {
      setActionLoading(userId);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} user`);
      await fetchUsers();
    } catch (err: any) {
      setActionError(err.message || `Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkAction(action: "ban" | "suspend" | "activate") {
    if (action === "activate") {
      try {
        setActionLoading("bulk");
        await Promise.all(
          Array.from(selectedUsers).map((id) =>
            fetch(`/api/admin/users/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action }),
            })
          )
        );
        setSelectedUsers(new Set());
        await fetchUsers();
      } catch (err: any) {
        setActionError(err.message || `Failed to activate users`);
      } finally {
        setActionLoading(null);
      }
      return;
    }
    setReasonText("");
    setReasonDialog({ action, targets: Array.from(selectedUsers), isBulk: true });
  }

  async function confirmReasonAction() {
    if (!reasonDialog) return;
    const { action, targets, isBulk } = reasonDialog;
    setReasonDialog(null);
    try {
      setActionLoading(isBulk ? "bulk" : targets[0]);
      await Promise.all(
        targets.map((id) =>
          fetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, reason: reasonText.trim() || undefined }),
          })
        )
      );
      if (isBulk) setSelectedUsers(new Set());
      await fetchUsers();
    } catch (err: any) {
      setActionError(err.message || `Failed to ${action} user(s)`);
    } finally {
      setActionLoading(null);
    }
  }

  function handleExportCSV() {
    exportToCSV(
      `users-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((u) => ({
        Name: u.fullName,
        Email: u.email,
        Phone: u.phone,
        Gender: u.gender,
        Age: u.age,
        Community: u.community,
        Location: u.location,
        Plan: u.plan,
        Status: u.status,
        Verified: u.isVerified ? "Yes" : "No",
        "Profile %": u.profileComplete,
        "Profile Views": u.profileViews,
        "Interests Sent": u.interestsSent,
        "Interests Received": u.interestsReceived,
        "Joined At": new Date(u.joinedAt).toLocaleDateString("en-IN"),
        "Last Active": new Date(u.lastActive).toLocaleDateString("en-IN"),
      }))
    );
  }

  // Derived stats
  const freeCount = users.filter((u) => u.plan === "free").length;
  const paidCount = users.filter((u) => u.plan !== "free").length;

  const filtered = useMemo(() => {
    let result = users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.location.toLowerCase().includes(search.toLowerCase()) ||
        u.community.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      const matchesPlan =
        planFilter === "all" ||
        (planFilter === "paid" ? u.plan !== "free" : planFilter === "free" ? u.plan === "free" : u.plan === planFilter);
      const matchesGender = genderFilter === "all" || u.gender === genderFilter;
      const matchesVerified =
        verifiedFilter === "all" ||
        (verifiedFilter === "verified" ? u.isVerified : !u.isVerified);
      return matchesSearch && matchesStatus && matchesPlan && matchesGender && matchesVerified;
    });

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.fullName.localeCompare(b.fullName);
          break;
        case "joined":
          cmp = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
          break;
        case "lastActive":
          cmp = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
          break;
        case "profileViews":
          cmp = a.profileViews - b.profileViews;
          break;
        case "profileComplete":
          cmp = a.profileComplete - b.profileComplete;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [users, search, statusFilter, planFilter, genderFilter, verifiedFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  }

  function toggleSelectAll() {
    if (selectedUsers.size === paginated.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginated.map((u) => u.id)));
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
    setGenderFilter("all");
    setVerifiedFilter("all");
    setPage(1);
  }

  const hasFilters = statusFilter !== "all" || planFilter !== "all" || genderFilter !== "all" || verifiedFilter !== "all" || search !== "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-3 text-neutral-500">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-neutral-600">{error}</p>
        <Button variant="ghost" size="sm" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700 flex-1">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Users Management</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {users.length} total users — {filtered.length} shown
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExportCSV} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="ghost" size="sm" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => { setPlanFilter("all"); setPage(1); }}
          className={cn(
            "rounded-[var(--radius-lg)] border p-4 text-left transition-all",
            planFilter === "all" ? "border-rose-300 bg-rose-50 shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-500" />
            <span className="text-xs font-medium text-neutral-500">All Users</span>
          </div>
          <p className="mt-1 text-xl font-bold text-neutral-900">{users.length}</p>
        </button>
        <button
          onClick={() => { setPlanFilter("free"); setPage(1); }}
          className={cn(
            "rounded-[var(--radius-lg)] border p-4 text-left transition-all",
            planFilter === "free" ? "border-blue-300 bg-blue-50 shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-neutral-500">Free Users</span>
          </div>
          <p className="mt-1 text-xl font-bold text-neutral-900">{freeCount}</p>
          <p className="text-xs text-neutral-400">{users.length > 0 ? ((freeCount / users.length) * 100).toFixed(0) : 0}% of total</p>
        </button>
        <button
          onClick={() => { setPlanFilter("paid"); setPage(1); }}
          className={cn(
            "rounded-[var(--radius-lg)] border p-4 text-left transition-all",
            planFilter === "paid" ? "border-amber-300 bg-amber-50 shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-neutral-500">Paid Users</span>
          </div>
          <p className="mt-1 text-xl font-bold text-neutral-900">{paidCount}</p>
          <p className="text-xs text-neutral-400">{users.length > 0 ? ((paidCount / users.length) * 100).toFixed(0) : 0}% of total</p>
        </button>
        <button
          onClick={() => { setVerifiedFilter(verifiedFilter === "verified" ? "all" : "verified"); setPage(1); }}
          className={cn(
            "rounded-[var(--radius-lg)] border p-4 text-left transition-all",
            verifiedFilter === "verified" ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"
          )}
        >
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-neutral-500">Verified</span>
          </div>
          <p className="mt-1 text-xl font-bold text-neutral-900">{users.filter((u) => u.isVerified).length}</p>
          <p className="text-xs text-neutral-400">{users.length > 0 ? ((users.filter((u) => u.isVerified).length / users.length) * 100).toFixed(0) : 0}% verified</p>
        </button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, location, community..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-10 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
            />
          </div>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-[var(--radius-md)] border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              {([
                ["name", "Name"],
                ["joined", "Date Joined"],
                ["lastActive", "Last Active"],
                ["profileViews", "Profile Views"],
                ["profileComplete", "Profile %"],
              ] as [SortKey, string][]).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={sortKey === key ? "text-rose-600 font-semibold" : ""}
                >
                  {label}
                  {sortKey === key && (
                    <ArrowDown className={cn("h-3 w-3 ml-auto", sortDir === "asc" && "rotate-180")} />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {/* Status */}
          {["all", "active", "suspended", "banned", "inactive"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-rose-100 text-rose-700"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}

          <span className="text-neutral-300 self-center">|</span>

          {/* Gender */}
          {[
            { key: "all", label: "All Gender" },
            { key: "male", label: "Male" },
            { key: "female", label: "Female" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setGenderFilter(key); setPage(1); }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                genderFilter === key
                  ? "bg-blue-100 text-blue-700"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {label}
            </button>
          ))}

          <span className="text-neutral-300 self-center">|</span>

          {/* Plan type (detailed) */}
          {[
            { key: "all", label: "All Plans" },
            { key: "free", label: "Free" },
            { key: "paid", label: "All Paid" },
            { key: "premium_3", label: "3M" },
            { key: "premium_6", label: "6M" },
            { key: "premium_12", label: "12M" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setPlanFilter(key); setPage(1); }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                planFilter === key
                  ? "bg-amber-100 text-amber-700"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {label}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-error bg-error-light hover:bg-red-100 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-rose-50 border border-rose-200 px-4 py-2">
          <span className="text-sm font-medium text-rose-700">
            {selectedUsers.size} selected
          </span>
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading === "bulk"}
              onClick={() => handleBulkAction("activate")}
            >
              <PlayCircle className="h-4 w-4" />
              Activate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading === "bulk"}
              onClick={() => handleBulkAction("suspend")}
            >
              <PauseCircle className="h-4 w-4" />
              Suspend
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={actionLoading === "bulk"}
              onClick={() => handleBulkAction("ban")}
            >
              <Ban className="h-4 w-4" />
              Ban
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading === "bulk"}
              onClick={() => {
                const rows = Array.from(selectedUsers).map((id) => users.find((u) => u.id === id)!).filter(Boolean);
                exportToCSV(`selected-users.csv`, rows.map((u) => ({
                  Name: u.fullName, Email: u.email, Status: u.status, Plan: u.plan,
                })));
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedUsers(new Set())}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reason Dialog */}
      {reasonDialog && (
        <Dialog open onOpenChange={() => setReasonDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reasonDialog.action === "ban" ? "Ban" : "Suspend"}{" "}
                {reasonDialog.isBulk ? `${reasonDialog.targets.length} users` : "User"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-neutral-600">
                Optionally provide a reason. This will be recorded in the activity log.
              </p>
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Reason (optional)..."
                rows={3}
                className="w-full rounded-[var(--radius-md)] border border-neutral-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setReasonDialog(null)}>
                Cancel
              </Button>
              <Button
                variant={reasonDialog.action === "ban" ? "destructive" : "ghost"}
                size="sm"
                onClick={confirmReasonAction}
              >
                {reasonDialog.action === "ban" ? (
                  <><Ban className="h-4 w-4" /> Confirm Ban</>
                ) : (
                  <><PauseCircle className="h-4 w-4" /> Confirm Suspend</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={paginated.length > 0 && selectedUsers.size === paginated.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-neutral-300"
              />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead className="hidden sm:table-cell">Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">
              <button onClick={() => toggleSort("profileViews")} className="flex items-center gap-1 hover:text-neutral-900">
                Views
                {sortKey === "profileViews" && <ArrowDown className={cn("h-3 w-3", sortDir === "asc" && "rotate-180")} />}
              </button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <button onClick={() => toggleSort("profileComplete")} className="flex items-center gap-1 hover:text-neutral-900">
                Profile %
                {sortKey === "profileComplete" && <ArrowDown className={cn("h-3 w-3", sortDir === "asc" && "rotate-180")} />}
              </button>
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              <button onClick={() => toggleSort("joined")} className="flex items-center gap-1 hover:text-neutral-900">
                Joined
                {sortKey === "joined" && <ArrowDown className={cn("h-3 w-3", sortDir === "asc" && "rotate-180")} />}
              </button>
            </TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-neutral-500">
                No users match your filters. Try adjusting your search criteria.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((user) => {
              const status = STATUS_BADGE[user.status];
              return (
                <TableRow key={user.id} className={selectedUsers.has(user.id) ? "bg-rose-50/50" : ""}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar name={user.fullName} size="sm" src={user.primaryPhotoUrl} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-neutral-900 truncate">{user.fullName}</p>
                          {user.isVerified && (
                            <span className="text-emerald-500" title="Verified">
                              <UserCheck className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {user.plan !== "free" && (
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-neutral-600">{user.location}</span>
                    <p className="text-xs text-neutral-400">{user.community}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={user.plan === "free" ? "default" : "primary"}
                      size="sm"
                    >
                      {PLAN_LABELS[user.plan]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} size="sm">
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-neutral-700 font-medium">{user.profileViews}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            user.profileComplete >= 80 ? "bg-emerald-500" :
                            user.profileComplete >= 50 ? "bg-amber-500" : "bg-red-400"
                          )}
                          style={{ width: `${user.profileComplete}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500">{user.profileComplete}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-neutral-500">
                    {new Date(user.joinedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status !== "active" && (
                          <DropdownMenuItem
                            disabled={actionLoading === user.id}
                            onClick={() => handleUserAction(user.id, "activate")}
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {user.status === "active" && (
                          <DropdownMenuItem
                            disabled={actionLoading === user.id}
                            onClick={() => handleUserAction(user.id, "suspend")}
                          >
                            <PauseCircle className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {user.status !== "banned" && (
                          <DropdownMenuItem
                            disabled={actionLoading === user.id}
                            onClick={() => handleUserAction(user.id, "ban")}
                            className="text-error"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          Showing {filtered.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(1)}
          >
            First
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={cn(
                  "h-8 w-8 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                  page === pageNum
                    ? "bg-rose-600 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                {pageNum}
              </button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(totalPages)}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
}
