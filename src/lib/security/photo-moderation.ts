export interface ModerationResult {
  approved: boolean;
  reason?: string;
  requiresReview?: boolean;
}

const SUSPICIOUS_NAME_REGEX = /nude|naked|sex(?:y)?|porn|nsfw|adult|xxx/i;

export async function moderatePhoto(params: {
  fileName: string;
  fileSize: number;
  buffer: Buffer;
}): Promise<ModerationResult> {
  // Reject suspiciously named files
  if (SUSPICIOUS_NAME_REGEX.test(params.fileName)) {
    return { approved: false, reason: "suspicious_filename" };
  }

  // Reject implausibly small files (likely corrupt or test data)
  if (params.fileSize < 2_000) {
    return { approved: false, reason: "file_too_small" };
  }

  // If an external NSFW API is configured, delegate to it
  const nsfwApiUrl = process.env.NSFW_API_URL;
  if (nsfwApiUrl) {
    try {
      return await callNsfwApi(nsfwApiUrl, params.buffer);
    } catch (err) {
      console.error("[PhotoMod] NSFW API error:", err);
      // API unavailable — approve but queue for manual review
      return { approved: true, requiresReview: true, reason: "api_unavailable" };
    }
  }

  // No external API — approve, flag all for admin spot-check
  return { approved: true, requiresReview: true };
}

async function callNsfwApi(apiUrl: string, buffer: Buffer): Promise<ModerationResult> {
  const formData = new FormData();
  formData.append("image", new Blob([new Uint8Array(buffer)]), "photo.jpg");

  const response = await fetch(apiUrl, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) throw new Error(`NSFW API ${response.status}`);

  // Expected payload: { isNsfw: boolean, confidence: number }
  const data = await response.json();
  if (data.isNsfw && (data.confidence ?? 1) > 0.8) {
    return { approved: false, reason: "nsfw_detected" };
  }

  return { approved: true };
}
