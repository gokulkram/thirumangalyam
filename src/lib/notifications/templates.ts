import { APP_NAME, CONTACT_EMAIL } from "@/lib/constants";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3001";
const BRAND = "#D64545";

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%">
      <!-- Header -->
      <tr><td style="background:${BRAND};padding:24px 32px">
        <p style="margin:0;font-size:22px;font-weight:bold;color:#fff">${APP_NAME}</p>
        <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.85)">South Indian Matrimony</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:32px">
        ${body}
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9f9f9;padding:20px 32px;border-top:1px solid #eee;text-align:center">
        <p style="margin:0;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${APP_NAME} ·
          <a href="${BASE_URL}/settings" style="color:#999">Manage notifications</a> ·
          <a href="mailto:${CONTACT_EMAIL}" style="color:#999">${CONTACT_EMAIL}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function btn(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;margin-top:20px">${label}</a>`;
}

// ─── Templates ─────────────────────────────────────────────────────────────

export function tplWelcome(name: string): string {
  return wrap(`
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:24px">Welcome to ${APP_NAME}, ${name}! 🎉</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px">
      Your account is ready. Complete your profile to start getting personalised matches from our community of verified profiles.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f8;border-radius:8px;padding:16px;margin-bottom:20px">
      <tr>
        <td width="36" valign="top" style="font-size:20px">✅</td>
        <td style="font-size:14px;color:#333;padding-left:8px">Upload a clear profile photo</td>
      </tr>
      <tr>
        <td width="36" valign="top" style="font-size:20px;padding-top:8px">✅</td>
        <td style="font-size:14px;color:#333;padding-left:8px;padding-top:8px">Fill in your basic details &amp; horoscope</td>
      </tr>
      <tr>
        <td width="36" valign="top" style="font-size:20px;padding-top:8px">✅</td>
        <td style="font-size:14px;color:#333;padding-left:8px;padding-top:8px">Set your partner preferences</td>
      </tr>
    </table>
    ${btn("Complete My Profile →", `${BASE_URL}/profile/me`)}
  `);
}

export function tplInterestReceived(recipientName: string, senderName: string, senderProfileId: string): string {
  return wrap(`
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px">You have a new interest! 💌</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
      Hi <strong>${recipientName}</strong>, <strong>${senderName}</strong> has sent you an interest on ${APP_NAME}.
      Login to view their full profile and respond.
    </p>
    <div style="background:#fff8f8;border-left:4px solid ${BRAND};border-radius:4px;padding:16px;margin-bottom:8px">
      <p style="margin:0;font-size:14px;color:#555">
        You can <strong>accept</strong> to start chatting, or <strong>decline</strong> if it's not a match.
        Interests expire after 30 days if not responded.
      </p>
    </div>
    ${btn("View Profile & Respond →", `${BASE_URL}/profile/${senderProfileId}`)}
    <p style="margin-top:20px;font-size:13px;color:#aaa">
      To stop receiving these emails, update your <a href="${BASE_URL}/settings" style="color:${BRAND}">notification preferences</a>.
    </p>
  `);
}

export function tplInterestAccepted(senderName: string, acceptorName: string, conversationLink: string): string {
  return wrap(`
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px">Great news — your interest was accepted! 🎊</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
      Hi <strong>${senderName}</strong>, <strong>${acceptorName}</strong> has accepted your interest.
      You can now chat and get to know each other better.
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;padding:16px;margin-bottom:8px">
      <p style="margin:0;font-size:14px;color:#166534">
        💬 Start a conversation now — the first message goes a long way!
      </p>
    </div>
    ${btn("Open Chat →", conversationLink)}
    <p style="margin-top:20px;font-size:13px;color:#aaa">
      Manage notifications in your <a href="${BASE_URL}/settings" style="color:${BRAND}">settings</a>.
    </p>
  `);
}

export function tplNewMessage(recipientName: string, senderName: string, preview: string, conversationLink: string): string {
  const safePreview = preview.length > 80 ? preview.slice(0, 80) + "…" : preview;
  return wrap(`
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px">New message from ${senderName} 💬</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px">
      Hi <strong>${recipientName}</strong>, you have an unread message waiting for you.
    </p>
    <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin-bottom:8px">
      <p style="margin:0;font-size:13px;color:#888;margin-bottom:4px">${senderName} wrote:</p>
      <p style="margin:0;font-size:15px;color:#333;font-style:italic">"${safePreview}"</p>
    </div>
    ${btn("Reply Now →", conversationLink)}
    <p style="margin-top:20px;font-size:13px;color:#aaa">
      Manage notifications in your <a href="${BASE_URL}/settings" style="color:${BRAND}">settings</a>.
    </p>
  `);
}

export function tplProfileViewed(viewedName: string, viewerName: string | null, isPremiumViewer: boolean): string {
  const viewerText = isPremiumViewer && viewerName
    ? `<strong>${viewerName}</strong> viewed your profile`
    : "Someone viewed your profile";

  return wrap(`
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px">Your profile was viewed 👀</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
      Hi <strong>${viewedName}</strong>, ${viewerText} on ${APP_NAME}.
      ${!isPremiumViewer ? "Upgrade to Premium to see exactly who's viewing you." : ""}
    </p>
    ${btn("View Who Visited Me →", `${BASE_URL}/who-viewed-me`)}
    <p style="margin-top:20px;font-size:13px;color:#aaa">
      To stop receiving these emails, update your <a href="${BASE_URL}/settings" style="color:${BRAND}">notification preferences</a>.
    </p>
  `);
}

const PLAN_LABELS: Record<string, string> = {
  premium_3: "Premium · 3 Months",
  premium_6: "Premium · 6 Months",
  premium_12: "Premium · 12 Months",
};

export function tplVerificationApproved(name: string): string {
  return wrap(`
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px">Your profile is now Verified! ✅</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
      Hi <strong>${name}</strong>, your identity document has been reviewed and approved.
      Your profile now shows the <strong>Verified</strong> badge, which significantly
      increases trust and match responses.
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;padding:16px;margin-bottom:20px">
      <p style="margin:0;font-size:14px;color:#166534">
        ✅ &nbsp;Verified badge displayed on your profile<br>
        ✅ &nbsp;Higher ranking in search results<br>
        ✅ &nbsp;+10 compatibility score boost in matches
      </p>
    </div>
    ${btn("View My Profile →", `${BASE_URL}/profile/me`)}
  `);
}

export function tplVerificationRejected(name: string, reason: string): string {
  return wrap(`
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px">Verification update required</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px">
      Hi <strong>${name}</strong>, we were unable to approve your verification request.
    </p>
    <div style="background:#fff5f5;border-left:4px solid #ef4444;border-radius:4px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 4px;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Reason</p>
      <p style="margin:0;font-size:14px;color:#c00">${reason || "Document did not meet verification criteria."}</p>
    </div>
    <p style="color:#555;font-size:14px;margin-bottom:20px">
      Please re-submit with a clearer, valid government-issued photo ID (Aadhaar, Passport, Voter ID, or Driving License).
    </p>
    ${btn("Re-submit Verification →", `${BASE_URL}/profile/me#verification`)}
  `);
}

export function tplPremiumActivated(name: string, plan: string, endDate: Date, amount: number): string {
  const planLabel = PLAN_LABELS[plan] || plan;
  const endStr = endDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return wrap(`
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px">Premium activated! 🎉</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
      Hi <strong>${name}</strong>, your ${APP_NAME} Premium membership is now active.
      Enjoy unlimited matches, direct chat, and full contact access.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f8;border-radius:8px;margin-bottom:20px">
      <tr><td style="padding:16px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#888;padding-bottom:8px">Plan</td>
            <td style="font-size:14px;font-weight:bold;color:#333;text-align:right;padding-bottom:8px">${planLabel}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#888;padding-bottom:8px">Valid until</td>
            <td style="font-size:14px;font-weight:bold;color:#333;text-align:right;padding-bottom:8px">${endStr}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#888">Amount paid</td>
            <td style="font-size:14px;font-weight:bold;color:#333;text-align:right">₹${amount.toLocaleString("en-IN")}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      ${["Unlimited daily matches", "Direct chat with all accepted matches", "View full contact details", "Detailed horoscope compatibility", "See who viewed your profile", "Priority customer support"]
        .map(f => `<tr><td style="font-size:14px;color:#333;padding:4px 0">✅ ${f}</td></tr>`)
        .join("")}
    </table>
    ${btn("Go to My Dashboard →", `${BASE_URL}/dashboard`)}
  `);
}
