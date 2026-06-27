import { create } from "zustand";
import type {
  AdminUser,
  UserRecord,
  VerificationRequest,
  Report,
  Subscription,
  AdminStats,
  ActivityLogEntry,
} from "@/types/admin";

/* ============================================================
   Store — loads data from API; no hardcoded mock data
   ============================================================ */

const emptyStats: AdminStats = {
  totalUsers: 0,
  activeToday: 0,
  pendingVerifications: 0,
  openReports: 0,
  openTickets: 0,
  totalInterests: 0,
  acceptedInterests: 0,
  interestAcceptRate: 0,
  totalProfileViews: 0,
  avgProfileViews: 0,
  monthlyRevenue: 0,
  newUsersThisWeek: 0,
  totalPremiumUsers: 0,
  freeUsers: 0,
  maleUsers: 0,
  femaleUsers: 0,
  conversionRate: 0,
  avgProfileCompletion: 0,
};

interface AdminState {
  admin: AdminUser;
  users: UserRecord[];
  verificationRequests: VerificationRequest[];
  reports: Report[];
  subscriptions: Subscription[];
  stats: AdminStats;
  activityLog: ActivityLogEntry[];
  loaded: boolean;

  // Data loading
  loadDashboard: () => Promise<void>;
  setAdmin: (admin: Partial<AdminUser>) => void;

  // User actions
  banUser: (userId: string) => void;
  suspendUser: (userId: string) => void;
  activateUser: (userId: string) => void;
  makePremium: (userId: string) => void;
  downgradeToFree: (userId: string) => void;

  // Verification actions
  approveVerification: (requestId: string) => void;
  rejectVerification: (requestId: string, reason: string) => void;

  // Report actions
  resolveReport: (reportId: string, resolution: string) => void;
  dismissReport: (reportId: string) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  admin: {
    id: "",
    name: "Admin",
    email: "admin@thirumangalyam.com",
    role: "super_admin",
    lastLogin: new Date().toISOString(),
  },
  users: [],
  verificationRequests: [],
  reports: [],
  subscriptions: [],
  stats: emptyStats,
  activityLog: [],
  loaded: false,

  loadDashboard: async () => {
    if (get().loaded) return;
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) return;
      const data = await res.json();
      set({
        stats: data.stats || emptyStats,
        users: data.users || [],
        activityLog: data.activityLog || [],
        loaded: true,
      });
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
    }
  },

  setAdmin: (admin) =>
    set((state) => ({ admin: { ...state.admin, ...admin } })),

  banUser: (userId) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status: "banned" as const } : u
      ),
    })),

  suspendUser: (userId) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status: "suspended" as const } : u
      ),
    })),

  activateUser: (userId) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status: "active" as const } : u
      ),
    })),

  makePremium: (userId) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, plan: "premium_6" as const } : u
      ),
    })),

  downgradeToFree: (userId) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, plan: "free" as const } : u
      ),
    })),

  approveVerification: (requestId) =>
    set((state) => ({
      verificationRequests: state.verificationRequests.map((v) =>
        v.id === requestId
          ? { ...v, status: "approved" as const, reviewedAt: new Date().toISOString() }
          : v
      ),
      stats: {
        ...state.stats,
        pendingVerifications: Math.max(0, state.stats.pendingVerifications - 1),
      },
    })),

  rejectVerification: (requestId, reason) =>
    set((state) => ({
      verificationRequests: state.verificationRequests.map((v) =>
        v.id === requestId
          ? {
              ...v,
              status: "rejected" as const,
              reviewedAt: new Date().toISOString(),
              rejectionReason: reason,
            }
          : v
      ),
      stats: {
        ...state.stats,
        pendingVerifications: Math.max(0, state.stats.pendingVerifications - 1),
      },
    })),

  resolveReport: (reportId, resolution) =>
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: "resolved" as const,
              resolvedAt: new Date().toISOString(),
              resolution,
            }
          : r
      ),
      stats: { ...state.stats, openReports: Math.max(0, state.stats.openReports - 1) },
    })),

  dismissReport: (reportId) =>
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId
          ? { ...r, status: "dismissed" as const, resolvedAt: new Date().toISOString() }
          : r
      ),
      stats: { ...state.stats, openReports: Math.max(0, state.stats.openReports - 1) },
    })),
}));
