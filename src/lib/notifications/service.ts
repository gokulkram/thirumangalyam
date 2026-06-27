/**
 * Central notification service.
 *
 * All public functions are fire-and-forget — call without await:
 *   notify.interestReceived({ ... }).catch(() => {});
 *
 * Each function:
 *  1. Fetches recipient user + profile (for prefs, email, phone, name)
 *  2. Checks notificationPrefs flags
 *  3. Throttle-guards high-frequency events (messages, profile views)
 *  4. Dispatches email and/or SMS
 */

import { connectDB } from "@/lib/db/connection";
import { User, Profile } from "@/lib/db/models";
import { sendUserEmail } from "@/lib/mailer";
import {
  smsInterestReceived,
  smsInterestAccepted,
  smsNewMessage,
  smsPremiumActivated,
  smsWelcome,
} from "./sms";
import {
  tplWelcome,
  tplInterestReceived,
  tplInterestAccepted,
  tplNewMessage,
  tplProfileViewed,
  tplVerificationApproved,
  tplVerificationRejected,
  tplPremiumActivated,
} from "./templates";
import { APP_NAME } from "@/lib/constants";
import { TTLCache } from "@/lib/cache";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3001";

// Throttle caches — prevent notification storms on high-frequency events
const msgThrottle  = new TTLCache<true>(2000); // 1 notify per conversation per 30 min
const pvThrottle   = new TTLCache<true>(5000); // 1 profile-view notify per viewer per 60 min

type Prefs = {
  email?: {
    newMatches?: boolean;
    interestsReceived?: boolean;
    interestAccepted?: boolean;
    newMessages?: boolean;
    profileViews?: boolean;
    weeklyDigest?: boolean;
  };
  push?: {
    interests?: boolean;
    messages?: boolean;
    matchAlerts?: boolean;
  };
};

/** Returns { user, profile, prefs } or null if user doesn't exist. */
async function getRecipient(userId: string) {
  await connectDB();
  const [user, profile] = await Promise.all([
    User.findById(userId).select("email phone notificationPrefs isPremium").lean(),
    Profile.findOne({ userId }).select("fullName").lean(),
  ]);
  if (!user) return null;
  const prefs: Prefs = (user as any).notificationPrefs ?? {};
  return {
    email: (user as any).email as string | undefined,
    phone: (user as any).phone as string | undefined,
    fullName: ((profile as any)?.fullName as string) || "User",
    isPremium: !!(user as any).isPremium,
    prefs,
  };
}

// ─── Public notification functions ─────────────────────────────────────────

/** Sent to the recipient when someone expresses interest in them. */
export async function notifyInterestReceived(params: {
  toUserId: string;
  fromProfileName: string;
  fromProfileId: string;
}): Promise<void> {
  try {
    const r = await getRecipient(params.toUserId);
    if (!r) return;

    const emailEnabled = r.prefs.email?.interestsReceived !== false;
    const smsEnabled   = r.prefs.push?.interests !== false;

    if (r.email && emailEnabled) {
      await sendUserEmail(
        r.email,
        `💌 ${params.fromProfileName} sent you an interest on ${APP_NAME}`,
        tplInterestReceived(r.fullName, params.fromProfileName, params.fromProfileId)
      );
    }

    if (r.phone && smsEnabled) {
      await smsInterestReceived(
        r.phone,
        r.fullName,
        params.fromProfileName,
        `${BASE_URL}/interests`
      );
    }
  } catch (err) {
    console.error("[Notify] interestReceived error:", err);
  }
}

/** Sent to the original sender when their interest is accepted. */
export async function notifyInterestAccepted(params: {
  toUserId: string;       // original sender
  byProfileName: string;  // who accepted
  conversationId?: string;
}): Promise<void> {
  try {
    const r = await getRecipient(params.toUserId);
    if (!r) return;

    const convLink = params.conversationId
      ? `${BASE_URL}/chat/${params.conversationId}`
      : `${BASE_URL}/interests`;

    const emailEnabled = r.prefs.email?.interestAccepted !== false;
    const smsEnabled   = r.prefs.push?.interests !== false;

    if (r.email && emailEnabled) {
      await sendUserEmail(
        r.email,
        `🎊 ${params.byProfileName} accepted your interest on ${APP_NAME}!`,
        tplInterestAccepted(r.fullName, params.byProfileName, convLink)
      );
    }

    if (r.phone && smsEnabled) {
      await smsInterestAccepted(r.phone, r.fullName, params.byProfileName, convLink);
    }
  } catch (err) {
    console.error("[Notify] interestAccepted error:", err);
  }
}

/** Sent to the OTHER participant when a message is sent. Throttled: 1 per 30 min per conversation. */
export async function notifyNewMessage(params: {
  toUserId: string;
  fromProfileName: string;
  conversationId: string;
  messagePreview: string;
}): Promise<void> {
  try {
    const throttleKey = `msg:${params.toUserId}:${params.conversationId}`;
    if (msgThrottle.get(throttleKey)) return; // already notified recently

    const r = await getRecipient(params.toUserId);
    if (!r) return;

    const emailEnabled = r.prefs.email?.newMessages !== false;
    const smsEnabled   = r.prefs.push?.messages !== false;

    if (!emailEnabled && !smsEnabled) return;

    const convLink = `${BASE_URL}/chat/${params.conversationId}`;

    if (r.email && emailEnabled) {
      await sendUserEmail(
        r.email,
        `💬 New message from ${params.fromProfileName} on ${APP_NAME}`,
        tplNewMessage(r.fullName, params.fromProfileName, params.messagePreview, convLink)
      );
    }

    if (r.phone && smsEnabled) {
      await smsNewMessage(r.phone, r.fullName, params.fromProfileName, convLink);
    }

    // Mark as notified for 30 minutes
    msgThrottle.set(throttleKey, true, 30 * 60 * 1000);
  } catch (err) {
    console.error("[Notify] newMessage error:", err);
  }
}

/** Sent to a user when their profile is viewed. Throttled: 1 per viewer per 60 min. */
export async function notifyProfileViewed(params: {
  viewedUserId: string;
  viewerUserId: string;
  viewerProfileName: string | null;
  viewerIsPremium: boolean;
}): Promise<void> {
  try {
    // Don't notify for self-views
    if (params.viewedUserId === params.viewerUserId) return;

    const throttleKey = `pv:${params.viewedUserId}:${params.viewerUserId}`;
    if (pvThrottle.get(throttleKey)) return;

    const r = await getRecipient(params.viewedUserId);
    if (!r) return;

    // Only send if user explicitly opted in (default is false)
    if (!r.prefs.email?.profileViews) return;
    if (!r.email) return;

    await sendUserEmail(
      r.email,
      `👀 Someone viewed your ${APP_NAME} profile`,
      tplProfileViewed(r.fullName, params.viewerProfileName, params.viewerIsPremium)
    );

    pvThrottle.set(throttleKey, true, 60 * 60 * 1000);
  } catch (err) {
    console.error("[Notify] profileViewed error:", err);
  }
}

/** Sent when admin approves identity verification. */
export async function notifyVerificationApproved(params: {
  userId: string;
}): Promise<void> {
  try {
    const r = await getRecipient(params.userId);
    if (!r?.email) return;
    await sendUserEmail(
      r.email,
      `✅ Your ${APP_NAME} profile is now Verified!`,
      tplVerificationApproved(r.fullName)
    );
  } catch (err) {
    console.error("[Notify] verificationApproved error:", err);
  }
}

/** Sent when admin rejects identity verification. */
export async function notifyVerificationRejected(params: {
  userId: string;
  reason: string;
}): Promise<void> {
  try {
    const r = await getRecipient(params.userId);
    if (!r?.email) return;
    await sendUserEmail(
      r.email,
      `Action needed: Re-submit your ${APP_NAME} verification`,
      tplVerificationRejected(r.fullName, params.reason)
    );
  } catch (err) {
    console.error("[Notify] verificationRejected error:", err);
  }
}

/** Sent immediately after a successful Razorpay payment. */
export async function notifyPremiumActivated(params: {
  userId: string;
  plan: string;
  endDate: Date;
  amount: number;
}): Promise<void> {
  try {
    const r = await getRecipient(params.userId);
    if (!r) return;

    const planLabel = ({ premium_3: "3-Month", premium_6: "6-Month", premium_12: "12-Month" }[params.plan] || params.plan);
    const endStr = params.endDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    if (r.email) {
      await sendUserEmail(
        r.email,
        `🎉 Premium membership activated — ${APP_NAME}`,
        tplPremiumActivated(r.fullName, params.plan, params.endDate, params.amount)
      );
    }

    if (r.phone) {
      await smsPremiumActivated(r.phone, r.fullName, planLabel, endStr);
    }
  } catch (err) {
    console.error("[Notify] premiumActivated error:", err);
  }
}

/** Sent once when a user creates their account. */
export async function notifyWelcome(params: {
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  try {
    if (params.email) {
      await sendUserEmail(
        params.email,
        `Welcome to ${APP_NAME}, ${params.fullName}! 🎉`,
        tplWelcome(params.fullName)
      );
    }

    if (params.phone) {
      await smsWelcome(params.phone, params.fullName, `${BASE_URL}/profile/me`);
    }
  } catch (err) {
    console.error("[Notify] welcome error:", err);
  }
}
