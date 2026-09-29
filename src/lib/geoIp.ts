import { NextRequest } from 'next/server';

export interface GeoIpInfo {
  ip: string;
  country: string;
  countryCode: string;
  flag: string;
  region: string;
  city: string;
  postal: string;
  isp: string;
  org: string;
  asn: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  isLocal: boolean;
  mapUrl?: string;
}

export interface UserDeviceInfo {
  browser: string;
  os: string;
  device: 'Asztali' | 'Mobil' | 'Tablet';
  isMobile: boolean;
  raw: string;
}

interface CacheEntry {
  data: GeoIpInfo;
  expiresAt: number;
}

// In-memory cache for IP lookups (2 hours TTL)
const ipCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Extracts real client IP address from request headers or socket handshake.
 */
export function getClientIp(req: Request | NextRequest | Headers | { headers: Headers | Record<string, string | string[] | undefined> }): string {
  let headers: Headers | Record<string, string | string[] | undefined>;

  if (req instanceof Request || ('headers' in req && req.headers instanceof Headers)) {
    headers = req.headers as Headers;
  } else if ('headers' in req) {
    headers = req.headers;
  } else {
    headers = req as Headers;
  }

  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    const val = headers[name] || headers[name.toLowerCase()];
    if (Array.isArray(val)) return val[0] || null;
    return val || null;
  };

  const cfIp = getHeader('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const xRealIp = getHeader('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  const xForwardedFor = getHeader('x-forwarded-for');
  if (xForwardedFor) {
    const list = xForwardedFor.split(',');
    if (list[0]) return list[0].trim();
  }

  return '127.0.0.1';
}

/**
 * Determines whether an IP is a local/private network address.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const clean = ip.trim().toLowerCase();

  if (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    clean.startsWith('fe80:') ||
    clean.startsWith('fc00:') ||
    clean.startsWith('fd')
  ) {
    return true;
  }

  // IPv4 Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
  const parts = clean.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  }

  return false;
}

/**
 * Converts a 2-letter country code into a flag emoji (e.g. HU -> 🇭🇺).
 */
export function getCountryFlag(countryCode?: string | null): string {
  if (!countryCode) return '🌐';
  const clean = countryCode.trim().toUpperCase();
  if (clean === 'LAN' || clean === 'LOCAL') return '🏠';
  if (clean.length !== 2) return '🌐';

  try {
    const codePoints = clean
      .split('')
      .map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

/**
 * Parses user agent string to extract device, OS, and browser.
 */
export function parseUserAgent(ua?: string | null): UserDeviceInfo {
  if (!ua) {
    return {
      browser: 'Ismeretlen',
      os: 'Ismeretlen',
      device: 'Asztali',
      isMobile: false,
      raw: '',
    };
  }

  const raw = ua;

  // OS Detection
  let os = 'Ismeretlen OS';
  if (/windows phone/i.test(ua)) os = 'Windows Phone';
  else if (/win(dows|98|nt|95)/i.test(ua)) {
    if (/nt 10\.0/i.test(ua)) os = 'Windows 10/11';
    else if (/nt 6\.3/i.test(ua)) os = 'Windows 8.1';
    else if (/nt 6\.1/i.test(ua)) os = 'Windows 7';
    else os = 'Windows';
  } else if (/iphone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/ipad/i.test(ua)) os = 'iOS (iPad)';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'ChromeOS';

  // Browser Detection
  let browser = 'Ismeretlen Böngésző';
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua)) browser = 'Apple Safari';

  // Device Detection
  const isTablet = /ipad|tablet|(android(?!.*mobile))/i.test(ua);
  const isMobile = !isTablet && /mobile|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua);
  const device: 'Asztali' | 'Mobil' | 'Tablet' = isTablet ? 'Tablet' : isMobile ? 'Mobil' : 'Asztali';

  return {
    browser,
    os,
    device,
    isMobile: isMobile || isTablet,
    raw,
  };
}

/**
 * Performs a cached, fast GeoIP lookup with HTTPS fallback.
 */
export async function lookupGeoIp(ip: string): Promise<GeoIpInfo> {
  const cleanIp = (ip || '').trim();

  // Check Local / Private IP
  if (isPrivateIp(cleanIp)) {
    return {
      ip: cleanIp || '127.0.0.1',
      country: 'Helyi hálózat / Belső szerver',
      countryCode: 'LAN',
      flag: '🏠',
      region: 'Localhost',
      city: 'Belső hálózat',
      postal: '—',
      isp: 'Fejlesztői / Belső hálózat',
      org: 'Local Private Network',
      asn: 'N/A',
      timezone: 'Europe/Budapest',
      latitude: 47.4979,
      longitude: 19.0402,
      isLocal: true,
      mapUrl: undefined,
    };
  }

  // Check In-Memory Cache
  const cached = ipCache.get(cleanIp);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // 1. Try ipapi.co (primary HTTPS service)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://ipapi.co/${encodeURIComponent(cleanIp)}/json/`, {
      headers: { 'User-Agent': 'AllYouTuber/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const d = await res.json();
      if (!d.error) {
        const countryCode = (d.country_code || d.country || '').toUpperCase();
        const flag = getCountryFlag(countryCode);
        const lat = typeof d.latitude === 'number' ? d.latitude : null;
        const lon = typeof d.longitude === 'number' ? d.longitude : null;

        const info: GeoIpInfo = {
          ip: cleanIp,
          country: d.country_name || d.country || 'Ismeretlen',
          countryCode: countryCode || 'XX',
          flag,
          region: d.region || d.region_code || '—',
          city: d.city || '—',
          postal: d.postal || '—',
          isp: d.org || d.asn || 'Ismeretlen szolgáltató',
          org: d.org || '—',
          asn: d.asn || '—',
          timezone: d.timezone || 'UTC',
          latitude: lat,
          longitude: lon,
          isLocal: false,
          mapUrl: lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : undefined,
        };

        ipCache.set(cleanIp, { data: info, expiresAt: Date.now() + CACHE_TTL_MS });
        return info;
      }
    }
  } catch (e) {
    // ipapi.co failed or timed out, try fallback
  }

  // 2. Try freeipapi.com (fallback HTTPS service)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`https://freeipapi.com/api/json/${encodeURIComponent(cleanIp)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const d = await res.json();
      const countryCode = (d.countryCode || '').toUpperCase();
      const flag = getCountryFlag(countryCode);
      const lat = typeof d.latitude === 'number' ? d.latitude : null;
      const lon = typeof d.longitude === 'number' ? d.longitude : null;

      const info: GeoIpInfo = {
        ip: cleanIp,
        country: d.countryName || 'Ismeretlen',
        countryCode: countryCode || 'XX',
        flag,
        region: d.regionName || '—',
        city: d.cityName || '—',
        postal: d.zipCode || '—',
        isp: 'Nyilvános internet',
        org: '—',
        asn: '—',
        timezone: d.timeZone || 'UTC',
        latitude: lat,
        longitude: lon,
        isLocal: false,
        mapUrl: lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : undefined,
      };

      ipCache.set(cleanIp, { data: info, expiresAt: Date.now() + CACHE_TTL_MS });
      return info;
    }
  } catch (e) {
    // Fallback failed
  }

  // 3. Fallback info if offline or APIs unreachable
  const fallbackInfo: GeoIpInfo = {
    ip: cleanIp,
    country: 'Nyilvános IP',
    countryCode: 'NET',
    flag: '🌐',
    region: '—',
    city: '—',
    postal: '—',
    isp: 'Internetszolgáltató',
    org: '—',
    asn: '—',
    timezone: 'UTC',
    latitude: null,
    longitude: null,
    isLocal: false,
    mapUrl: undefined,
  };

  ipCache.set(cleanIp, { data: fallbackInfo, expiresAt: Date.now() + 10 * 60 * 1000 });
  return fallbackInfo;
}
