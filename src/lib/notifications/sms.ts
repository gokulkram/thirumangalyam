/**
 * Transactional SMS via MSG91 Flow API.
 *
 * Each SMS type needs a DLT-approved template registered in the MSG91 dashboard.
 * Set the corresponding env var to the template ID to enable that notification type.
 * If the env var is absent the message is logged to console (demo mode).
 *
 * DLT template examples (register these on MSG91):
 *   INTEREST_RECEIVED : "Hi {#var#}, {#var#} has sent you an interest on Thirumangalyam. Login: {#var#}"
 *   INTEREST_ACCEPTED : "Hi {#var#}, {#var#} accepted your interest on Thirumangalyam! Login to chat: {#var#}"
 *   NEW_MESSAGE       : "Hi {#var#}, you have a new message from {#var#} on Thirumangalyam. Login: {#var#}"
 *   PREMIUM_ACTIVATED : "Hi {#var#}, your Thirumangalyam Premium ({#var#}) is active till {#var#}. Enjoy!"
 *   WELCOME           : "Welcome to Thirumangalyam, {#var#}! Complete your profile to find your match: {#var#}"
 */

const AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
const FLOW_URL = "https://control.msg91.com/api/v5/flow/";

const TEMPLATES = {
  interestReceived: process.env.MSG91_TMPL_INTEREST_RECEIVED || "",
  interestAccepted: process.env.MSG91_TMPL_INTEREST_ACCEPTED || "",
  newMessage:       process.env.MSG91_TMPL_NEW_MESSAGE || "",
  premiumActivated: process.env.MSG91_TMPL_PREMIUM_ACTIVATED || "",
  welcome:          process.env.MSG91_TMPL_WELCOME || "",
};

const isDemoMode = !AUTH_KEY || AUTH_KEY === "your_msg91_auth_key";

/** Normalise to 91XXXXXXXXXX (no + prefix). */
function toMsgPhone(phone: string): string {
  const clean = phone.replace(/[\s\-()]/g, "");
  if (clean.startsWith("+91")) return clean.slice(1);
  if (clean.startsWith("91") && clean.length === 12) return clean;
  return `91${clean}`;
}

async function sendFlow(
  templateKey: keyof typeof TEMPLATES,
  phone: string,
  vars: Record<string, string>
): Promise<void> {
  const templateId = TEMPLATES[templateKey];

  if (isDemoMode || !templateId) {
    console.log(`[SMS DEMO] ${templateKey} → ${phone}`, vars);
    return;
  }

  try {
    const payload = {
      template_id: templateId,
      short_url: "0",
      mobiles: toMsgPhone(phone),
      ...vars,
    };

    const res = await fetch(FLOW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: AUTH_KEY,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });

    const data = await res.json().catch(() => ({}));
    if (data.type !== "success") {
      console.warn(`[SMS] ${templateKey} failed:`, data.message || data);
    }
  } catch (err) {
    console.error(`[SMS] ${templateKey} error:`, err);
  }
}

// ─── Public helpers ────────────────────────────────────────────────────────

export function smsInterestReceived(phone: string, recipientName: string, senderName: string, link: string) {
  return sendFlow("interestReceived", phone, { var1: recipientName, var2: senderName, var3: link });
}

export function smsInterestAccepted(phone: string, senderName: string, acceptorName: string, link: string) {
  return sendFlow("interestAccepted", phone, { var1: senderName, var2: acceptorName, var3: link });
}

export function smsNewMessage(phone: string, recipientName: string, senderName: string, link: string) {
  return sendFlow("newMessage", phone, { var1: recipientName, var2: senderName, var3: link });
}

export function smsPremiumActivated(phone: string, name: string, plan: string, endDate: string) {
  return sendFlow("premiumActivated", phone, { var1: name, var2: plan, var3: endDate });
}

export function smsWelcome(phone: string, name: string, link: string) {
  return sendFlow("welcome", phone, { var1: name, var2: link });
}
