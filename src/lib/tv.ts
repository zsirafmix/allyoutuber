import crypto from 'crypto';
import prisma from './prisma';
import { TvSessionStatus } from '@prisma/client';

// Clean alphanumeric character set avoiding confusing glyphs (0, O, I, 1)
export const PAIRING_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const PAIRING_CODE_LENGTH = 6;
export const PAIRING_EXPIRY_MINUTES = 10;

// In-memory rate limiting for pairing code attempts (brute-force prevention: 10 attempts/min/IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkPairingRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + 60 * 1000 });
    return { allowed: true, remaining: 9 };
  }

  if (entry.count >= 10) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: 10 - entry.count };
}

/**
 * Generates a clean, 6-character random pairing code.
 */
export function generatePairingCode(): string {
  const bytes = crypto.randomBytes(PAIRING_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
    const index = bytes[i] % PAIRING_CHARS.length;
    code += PAIRING_CHARS[index];
  }
  return code;
}

/**
 * Hashes a pairing code with SHA256 for secure DB storage.
 */
export function hashPairingCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}

/**
 * Generates a secure random session token.
 */
export function generateTvToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a new TV session with a 10-minute pairing code.
 */
export async function createTvSession(deviceName = 'TV-1') {
  const pairingCode = generatePairingCode();
  const pairingCodeHash = hashPairingCode(pairingCode);
  const token = generateTvToken();
  const expiresAt = new Date(Date.now() + PAIRING_EXPIRY_MINUTES * 60 * 1000);

  const session = await prisma.tvSession.create({
    data: {
      token,
      deviceName,
      pairingCodeHash,
      pairingCodePrefix: pairingCode.slice(0, 2),
      status: TvSessionStatus.WAITING,
      expiresAt,
    },
  });

  return {
    session,
    pairingCode,
    expiresAt,
  };
}

/**
 * Claims a pairing code from mobile/desktop client, pairing the TV with the specified room.
 */
export async function claimPairingCode(
  rawCode: string,
  roomId: string,
  userId?: string,
  customDeviceName?: string,
  ipIdentifier = 'global'
) {
  // 1. Rate-limiting check
  const rl = checkPairingRateLimit(ipIdentifier);
  if (!rl.allowed) {
    throw new Error('Túl sok párosítási kísérlet. Kérlek várj 1 percet a következő próbálkozás előtt!');
  }

  const cleanCode = rawCode.trim().toUpperCase();
  if (cleanCode.length !== PAIRING_CODE_LENGTH) {
    throw new Error('A párosítási kódnak pontosan 6 karakterből kell állnia.');
  }

  const codeHash = hashPairingCode(cleanCode);

  // 2. Lookup TV Session
  const session = await prisma.tvSession.findUnique({
    where: { pairingCodeHash: codeHash },
  });

  if (!session) {
    throw new Error('Érvénytelen vagy nem létező párosítási kód.');
  }

  // 3. Check expiration
  if (new Date() > session.expiresAt) {
    await prisma.tvSession.update({
      where: { id: session.id },
      data: { status: TvSessionStatus.EXPIRED, pairingCodeHash: null },
    });
    throw new Error('Ez a párosítási kód már lejárt. Kérj új kódot a TV képernyőjén!');
  }

  // 4. Verify room exists
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      settings: true,
      playbackState: true,
    },
  });

  if (!room) {
    throw new Error('A megadott szoba nem található.');
  }

  // 5. Update session to PAIRED and invalidate one-time pairing code
  const updatedSession = await prisma.tvSession.update({
    where: { id: session.id },
    data: {
      status: TvSessionStatus.PAIRED,
      roomId: room.id,
      deviceName: customDeviceName?.trim() || session.deviceName || 'TV-1',
      pairedAt: new Date(),
      lastSeenAt: new Date(),
      pairingCodeHash: null, // Invalidate code after single use
      pairingCodePrefix: null,
    },
    include: {
      room: {
        include: {
          settings: true,
          playbackState: true,
        },
      },
    },
  });

  // 6. Create Audit Log
  try {
    await prisma.auditLog.create({
      data: {
        roomId: room.id,
        userId: userId || null,
        action: 'TV_PAIR_SUCCESS',
        details: `TV párosítva: "${updatedSession.deviceName}" (ID: ${updatedSession.id})`,
      },
    });
  } catch (err) {
    console.error('Failed to log TV_PAIR_SUCCESS audit:', err);
  }

  return {
    session: updatedSession,
    room,
  };
}

/**
 * Look up TV session by token.
 */
export async function getTvSessionByToken(token: string) {
  if (!token) return null;
  return prisma.tvSession.findUnique({
    where: { token },
    include: {
      room: {
        include: {
          settings: true,
          playbackState: true,
        },
      },
    },
  });
}

/**
 * List all paired TV sessions for a specific room.
 */
export async function getRoomTvSessions(roomId: string) {
  return prisma.tvSession.findMany({
    where: {
      roomId,
      status: { in: [TvSessionStatus.PAIRED, TvSessionStatus.DISCONNECTED] },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Disconnects a TV session.
 */
export async function disconnectTvSession(sessionId: string, userId?: string) {
  const session = await prisma.tvSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error('TV session nem található.');
  }

  const updated = await prisma.tvSession.update({
    where: { id: sessionId },
    data: {
      status: TvSessionStatus.DISCONNECTED,
      roomId: null,
      pairingCodeHash: null,
    },
  });

  try {
    if (session.roomId) {
      await prisma.auditLog.create({
        data: {
          roomId: session.roomId,
          userId: userId || null,
          action: 'TV_REMOVED',
          details: `TV leválasztva: "${session.deviceName}" (ID: ${session.id})`,
        },
      });
    }
  } catch {}

  return updated;
}

/**
 * Updates a TV device name.
 */
export async function updateTvSessionName(sessionId: string, deviceName: string) {
  const trimmed = deviceName.trim();
  if (!trimmed || trimmed.length > 32) {
    throw new Error('A TV nevének 1 és 32 karakter között kell lennie.');
  }

  return prisma.tvSession.update({
    where: { id: sessionId },
    data: { deviceName: trimmed },
  });
}

/**
 * Heartbeat updater for connected TV sessions.
 */
export async function heartbeatTvSession(sessionId: string) {
  return prisma.tvSession.update({
    where: { id: sessionId },
    data: { lastSeenAt: new Date() },
  });
}
