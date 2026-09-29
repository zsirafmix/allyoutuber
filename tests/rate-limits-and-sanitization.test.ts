import { describe, it, expect } from 'vitest';
import { checkChatRateLimit, checkEmojiRateLimit, sanitizeText } from '../src/lib/rateLimit';

describe('Rate Limiting & Sanitization', () => {
  it('enforces chat rate limit (max 3 messages within 3 seconds)', () => {
    const testUser = 'user-chat-test-' + Date.now();
    expect(checkChatRateLimit(testUser)).toBe(true);
    expect(checkChatRateLimit(testUser)).toBe(true);
    expect(checkChatRateLimit(testUser)).toBe(true);
    // 4th message in rapid succession is blocked
    expect(checkChatRateLimit(testUser)).toBe(false);
  });

  it('enforces emoji reaction rate limit (max 5 reactions within 10 seconds)', () => {
    const testUser = 'user-emoji-test-' + Date.now();
    for (let i = 0; i < 5; i++) {
      expect(checkEmojiRateLimit(testUser)).toBe(true);
    }
    // 6th reaction is blocked
    expect(checkEmojiRateLimit(testUser)).toBe(false);
  });

  it('sanitizes HTML tags and script injections', () => {
    const malicious = '<script>alert("hack")</script>Hello <b>World</b>!';
    const sanitized = sanitizeText(malicious);
    expect(sanitized).not.toContain('<');
    expect(sanitized).not.toContain('>');
    expect(sanitized).toBe('scriptalert("hack")/scriptHello bWorld/b!');
  });
});
