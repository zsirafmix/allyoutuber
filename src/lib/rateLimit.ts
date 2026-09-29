interface RateLimitBucket {
  timestamps: number[];
}

const chatBuckets = new Map<string, RateLimitBucket>();
const emojiBuckets = new Map<string, RateLimitBucket>();

/**
 * Checks if an action is within rate limits using a sliding window.
 */
function checkLimit(
  map: Map<string, RateLimitBucket>,
  key: string,
  maxCount: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = map.get(key) || { timestamps: [] };

  // Remove timestamps outside window
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (bucket.timestamps.length >= maxCount) {
    return false; // Rate limit exceeded
  }

  bucket.timestamps.push(now);
  map.set(key, bucket);
  return true;
}

/**
 * Rate limit chat: max 3 messages per 3 seconds per user.
 */
export function checkChatRateLimit(userId: string): boolean {
  return checkLimit(chatBuckets, userId, 3, 3000);
}

/**
 * Rate limit emojis: max 5 reactions per 10 seconds per user.
 */
export function checkEmojiRateLimit(userId: string): boolean {
  return checkLimit(emojiBuckets, userId, 5, 10000);
}

/**
 * Strips HTML and dangerous characters to prevent XSS.
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // remove HTML tag brackets
    .trim();
}
