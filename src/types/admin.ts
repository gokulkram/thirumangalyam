/* ============================================================
   Thirumangalyam — Admin Type Definitions
   ============================================================ */

export type AdminRole = "super_admin" | "moderator" | "support";

export type UserStatus = "active" | "suspended" | "banned" | "inactive";

export type VerificationRequestStatus = "pending" | "approved" | "rejected";

export type ReportStatus = "open" | "resolved" | "dismissed";

export type ReportReason =
  | "fake_profile"
  | "inappropriate_photos"
  | "harassment"
  | "spam"
  | "underage"
  | "other";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
  lastLogin: string;
}

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: "male" | "female";
  age: number;
  community: string;
  location: string;
  plan: "free" | "premium_3" | "premium_6" | "premium_12";
  status: UserStatus;
  isVerified: boolean;
  reportsCount: number;
  profileComplete: number;
  joinedAt: string;
  lastActive: string;
  primaryPhotoUrl?: string;
  interestsSent: number;
  interestsReceived: number;
  profileViews: number;
  lastLoginIp: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  documentType: "aadhaar" | "passport" | "voter_id" | "driving_license";
  documentUrl: string;
  selfieUrl: string;
  status: VerificationRequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface Report {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedByUserId: string;
  reportedByUserName: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  userName: string;
  plan: "premium_3" | "premium_6" | "premium_12";
  amount: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  paymentMethod: string;
}

export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  pendingVerifications: number;
  openReports: number;
  monthlyRevenue: number;
  newUsersThisWeek: number;
  totalPremiumUsers: number;
  freeUsers: number;
  maleUsers: number;
  femaleUsers: number;
  conversionRate: number;
  avgProfileCompletion: number;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}
