import { describe, it, expect } from 'vitest';
import {
  generatePairingCode,
  hashPairingCode,
  checkPairingRateLimit,
  PAIRING_CHARS,
  PAIRING_CODE_LENGTH,
} from '../src/lib/tv';

describe('TV Mode Pairing System', () => {
  it('generates a 6-character clean code without ambiguous characters (0, O, I, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generatePairingCode();
      expect(code).toHaveLength(PAIRING_CODE_LENGTH);

      // Check each character is in the allowed whitelist
      for (const char of code) {
        expect(PAIRING_CHARS).toContain(char);
      }

      // Assert forbidden ambiguous characters are NEVER present
      expect(code).not.toContain('0');
      expect(code).not.toContain('O');
      expect(code).not.toContain('I');
      expect(code).not.toContain('1');
    }
  });

  it('produces deterministic SHA256 hashes normalized to uppercase', () => {
    const code = 'A7K4Q2';
    const hash1 = hashPairingCode('a7k4q2');
    const hash2 = hashPairingCode('  A7K4Q2 ');
    const hash3 = hashPairingCode(code);

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
    expect(hash1).toHaveLength(64); // standard sha256 hex length
  });

  it('enforces brute-force rate-limiting of 10 attempts per minute per identifier', () => {
    const testIp = `test-ip-${Date.now()}`;

    // First 10 attempts should be allowed
    for (let i = 1; i <= 10; i++) {
      const result = checkPairingRateLimit(testIp);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10 - i);
    }

    // 11th attempt must be rejected
    const blockedResult = checkPairingRateLimit(testIp);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
  });
});
