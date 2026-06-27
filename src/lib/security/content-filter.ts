// Non-global regexes to avoid lastIndex state issues
const PHONE_REGEX = /(?:\+?91[\s\-]?)?[6-9]\d{9}|\+\d{10,14}|\b\d{10,11}\b/;
const URL_REGEX = /https?:\/\/\S+|www\.\S+/i;

const CONTACT_EXCHANGE_PATTERNS = [
  /whatsapp\s*me/i,
  /call\s+me\s+at/i,
  /contact\s+me\s+on/i,
  /my\s+(?:phone|mobile|number)\s+is/i,
  /reach\s+me\s+(?:at|on)/i,
  /telegram\s*[:@]/i,
  /instagram\s*[:@]/i,
  /snapchat\s*[:@]/i,
];

const EXPLICIT_KEYWORDS = [
  "sex", "nude", "naked", "porn", "xxx", "nsfw",
  "fuck", "pussy", "dick", "cock", "boob",
  "sexual", "erotic",
];

export interface FilterResult {
  blocked: boolean;
  flagged: boolean;
  reason: string;
}

export function filterMessage(content: string): FilterResult {
  if (!content) return { blocked: false, flagged: false, reason: "" };

  // Phone numbers — block outright
  if (PHONE_REGEX.test(content)) {
    return { blocked: true, flagged: true, reason: "phone_number" };
  }

  // Contact exchange patterns — block
  for (const pattern of CONTACT_EXCHANGE_PATTERNS) {
    if (pattern.test(content)) {
      return { blocked: true, flagged: true, reason: "contact_exchange" };
    }
  }

  // External URLs — flag but allow
  if (URL_REGEX.test(content)) {
    return { blocked: false, flagged: true, reason: "external_url" };
  }

  // Explicit content — block
  const lower = content.toLowerCase();
  for (const kw of EXPLICIT_KEYWORDS) {
    // whole-word match using word boundaries
    if (new RegExp(`\\b${kw}\\b`).test(lower)) {
      return { blocked: true, flagged: true, reason: "explicit_content" };
    }
  }

  return { blocked: false, flagged: false, reason: "" };
}

// In-memory rate limiter: max 20 messages per user per 60 s
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

export function checkMessageRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}
