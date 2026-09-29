import crypto from 'crypto';
import prisma from './prisma';

export interface AuthSession {
  userId: string;
  nickname: string;
  sessionToken: string;
  isGlobalAdmin: boolean;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashInviteCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}

export function generateInviteCode(): string {
  // Format: K7X4-P9ZM (8 chars uppercase alphanumeric excluding ambiguous chars like 0, O, 1, I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(crypto.randomInt(0, chars.length));
    p2 += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return `${p1}-${p2}`;
}

/**
 * Creates or retrieves a user by nickname, then generates a persistent session.
 */
export async function createSessionForNickname(
  nickname: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ sessionToken: string; user: { id: string; nickname: string; isGlobalAdmin: boolean } }> {
  const sanitizedNick = nickname.trim().slice(0, 24);
  if (sanitizedNick.length < 2) {
    throw new Error('Nickname must be at least 2 characters long.');
  }

  // Find existing user with this nickname (case-insensitive) to remember user identity
  let user = await prisma.user.findFirst({
    where: {
      nickname: {
        equals: sanitizedNick,
        mode: 'insensitive',
      },
    },
  });

  if (user) {
    // Existing user found! Update timestamp and maintain identity
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        nickname: sanitizedNick,
        updatedAt: new Date(),
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        nickname: sanitizedNick,
      },
    });
  }

  const sessionToken = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days persistent login

  await prisma.userSession.create({
    data: {
      sessionToken,
      userId: user.id,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    },
  });

  return { sessionToken, user };
}

/**
 * Resolves session from a token.
 */
export async function getSession(sessionToken: string): Promise<AuthSession | null> {
  if (!sessionToken) return null;

  const session = await prisma.userSession.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  // Update last seen
  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return {
    userId: session.user.id,
    nickname: session.user.nickname,
    sessionToken: session.sessionToken,
    isGlobalAdmin: session.user.isGlobalAdmin,
  };
}
