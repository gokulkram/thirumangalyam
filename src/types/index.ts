/* ============================================================
   Thirumangalyam — Core Type Definitions
   ============================================================ */

export type UserRole = "individual" | "parent" | "guardian";

export type Gender = "male" | "female";

export type MaritalStatus = "never_married" | "divorced" | "widowed" | "awaiting_divorce";

export type Diet = "vegetarian" | "non_vegetarian" | "eggetarian";

export type FamilyType = "joint" | "nuclear";

export type VerificationStatus = "unverified" | "pending" | "verified";

export type InterestStatus = "pending" | "accepted" | "declined" | "expired" | "withdrawn";

export type SubscriptionPlan = "free" | "premium_3" | "premium_6" | "premium_12";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface User {
  id: string;
  phone?: string;
  email?: string;
  role: UserRole;
  gender: Gender;
  isPremium: boolean;
  plan: SubscriptionPlan;
  profileComplete: number; // 0-100
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  // Step 1 — Basic
  fullName: string;
  dateOfBirth: string;
  age: number;
  height: string;
  motherTongue: string;
  community: string;
  subCaste?: string;
  maritalStatus: MaritalStatus;
  hasChildren: boolean;
  numberOfChildren?: number;
  // Step 2 — Religious & Family
  religion: string;
  gothra?: string;
  star: string;
  rashi?: string;
  hasDosham: boolean | null; // null = don't know
  familyType: FamilyType;
  familyStatus: string;
  fatherOccupation: string;
  motherOccupation: string;
  brothersMarried: number;
  brothersUnmarried: number;
  sistersMarried: number;
  sistersUnmarried: number;
  // Step 3 — Education & Career
  highestDegree: string;
  institution?: string;
  occupation: string;
  employer?: string;
  annualIncome?: string;
  workLocation: string;
  city: string;
  state: string;
  country: string;
  whatsappNumber?: string;
  // Step 4 — Lifestyle & About
  diet: Diet;
  smoking: "no" | "occasionally" | "yes";
  drinking: "no" | "occasionally" | "yes";
  hobbies: string[];
  aboutMe: string;
  lookingFor: string;
  // Step 5 — Photos
  photos: ProfilePhoto[];
  horoscopeUrl?: string;
  verificationStatus: VerificationStatus;
  // Metadata
  isOnline: boolean;
  lastActive: string;
  profileViews: number;
}

export interface ProfilePhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

export interface PartnerPreferences {
  // Basic
  ageRange: [number, number];
  heightRange: [string, string];
  maritalStatus: MaritalStatus[];
  childrenAcceptable: "no" | "yes" | "doesnt_matter";
  // Community & Language
  motherTongues: string[];
  communities: string[];
  gothra: string;
  // Education & Career
  education: string[];
  occupation: string[];
  employmentType: "any" | "employed" | "business" | "government" | "not_working_ok";
  annualIncomeMin: string;
  // Location & Residency
  locations: string[];
  citizenship: "any" | "indian" | "nri" | "open_to_relocate";
  // Horoscope
  starCompatibility: "must" | "preferred" | "not_important";
  dosham: "must_not" | "doesnt_matter";
  // Lifestyle
  diet: "must_veg" | "doesnt_matter";
  smokingAcceptable: "no" | "occasionally_ok" | "doesnt_matter";
  drinkingAcceptable: "no" | "occasionally_ok" | "doesnt_matter";
  // Family
  familyType: "any" | "nuclear" | "joint";
  familyStatus: string[];
  // Physical
  complexion: "any" | "very_fair" | "fair" | "wheatish" | "dark";
  physicalDisability: "no_disability" | "doesnt_matter";
}

export interface MatchCard {
  id: string;
  profileId: string;
  fullName: string;
  age: number;
  height: string;
  occupation: string;
  location: string;
  community: string;
  primaryPhotoUrl: string;
  isVerified: boolean;
  isPremium: boolean;
  isOnline: boolean;
  compatibilityScore?: number;
  isShortlisted: boolean;
}

export interface Interest {
  id: string;
  fromProfileId: string;
  toProfileId: string;
  status: InterestStatus;
  note?: string;
  sentAt: string;
  respondedAt?: string;
  profile: MatchCard; // the other person's card
}

export interface ChatConversation {
  id: string;
  otherProfile: MatchCard;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "text" | "system" | "photo";
  sentAt: string;
  isRead: boolean;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
}

export interface HoroscopeMatch {
  profileA: { name: string; star: string; rashi: string; hasDosham: boolean | null };
  profileB: { name: string; star: string; rashi: string; hasDosham: boolean | null };
  overallScore: number;
  maxScore: number;
  label: string;
  poruthams: Porutham[];
  doshamResult: string;
}

export interface Porutham {
  name: string;
  tamilName: string;
  isCompatible: boolean | "partial";
  description: string;
}

export interface PremiumPlan {
  id: SubscriptionPlan;
  label: string;
  months: number;
  totalPrice: number;
  monthlyPrice: number;
  savings?: string;
  isPopular: boolean;
}

// Admin types
export type {
  AdminRole,
  UserStatus,
  VerificationRequestStatus,
  ReportStatus,
  ReportReason,
  AdminUser,
  UserRecord,
  VerificationRequest,
  Report,
  Subscription,
  AdminStats,
  ActivityLogEntry,
} from "./admin";
