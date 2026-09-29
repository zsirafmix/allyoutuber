import { describe, it, expect } from 'vitest';
import {
  isPrivateIp,
  getCountryFlag,
  parseUserAgent,
  getClientIp,
  lookupGeoIp,
} from '../src/lib/geoIp';

describe('GeoIP & User Device Inspection System', () => {
  it('correctly identifies local/private IP addresses', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('::1')).toBe(true);
    expect(isPrivateIp('localhost')).toBe(true);
    expect(isPrivateIp('192.168.1.100')).toBe(true);
    expect(isPrivateIp('10.0.4.15')).toBe(true);
    expect(isPrivateIp('172.20.10.2')).toBe(true);

    // Public IPs
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('195.228.12.34')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
  });

  it('generates country flag emojis from ISO country codes', () => {
    expect(getCountryFlag('HU')).toBe('🇭🇺');
    expect(getCountryFlag('US')).toBe('🇺🇸');
    expect(getCountryFlag('DE')).toBe('🇩🇪');
    expect(getCountryFlag('FR')).toBe('🇫🇷');
    expect(getCountryFlag('LAN')).toBe('🏠');
    expect(getCountryFlag(null)).toBe('🌐');
  });

  it('parses desktop user agent accurately', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const info = parseUserAgent(ua);

    expect(info.os).toBe('Windows 10/11');
    expect(info.browser).toBe('Google Chrome');
    expect(info.device).toBe('Asztali');
    expect(info.isMobile).toBe(false);
  });

  it('parses mobile iPhone user agent accurately', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1';
    const info = parseUserAgent(ua);

    expect(info.os).toBe('iOS (iPhone)');
    expect(info.browser).toBe('Apple Safari');
    expect(info.device).toBe('Mobil');
    expect(info.isMobile).toBe(true);
  });

  it('parses Android mobile user agent accurately', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.80 Mobile Safari/537.36';
    const info = parseUserAgent(ua);

    expect(info.os).toBe('Android');
    expect(info.browser).toBe('Google Chrome');
    expect(info.device).toBe('Mobil');
    expect(info.isMobile).toBe(true);
  });

  it('extracts real client IP prioritizing headers', () => {
    const headers1 = new Headers({ 'cf-connecting-ip': '195.228.12.34' });
    expect(getClientIp(headers1)).toBe('195.228.12.34');

    const headers2 = new Headers({ 'x-real-ip': '80.99.12.1' });
    expect(getClientIp(headers2)).toBe('80.99.12.1');

    const headers3 = new Headers({ 'x-forwarded-for': '178.48.55.10, 10.0.0.1' });
    expect(getClientIp(headers3)).toBe('178.48.55.10');

    const headers4 = new Headers({});
    expect(getClientIp(headers4)).toBe('127.0.0.1');
  });

  it('resolves local IP immediately with LAN metadata without network calls', async () => {
    const geo = await lookupGeoIp('127.0.0.1');
    expect(geo.isLocal).toBe(true);
    expect(geo.countryCode).toBe('LAN');
    expect(geo.flag).toBe('🏠');
    expect(geo.city).toBe('Belső hálózat');
  });

  it('resolves public IP and caches the result', async () => {
    const geo = await lookupGeoIp('8.8.8.8');
    expect(geo.ip).toBe('8.8.8.8');
    expect(geo.country).toBeDefined();
    expect(geo.countryCode).toBeDefined();
    expect(geo.flag).toBeDefined();

    // Second call should return cached result immediately
    const start = Date.now();
    const cachedGeo = await lookupGeoIp('8.8.8.8');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50); // Instant in-memory cache hit
    expect(cachedGeo.ip).toBe('8.8.8.8');
  });
});
