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
export async function getSession(
  sessionToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthSession | null> {
  if (!sessionToken) return null;

  const session = await prisma.userSession.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  // Update last seen, IP, and userAgent
  const updateData: any = { lastSeenAt: new Date() };
  if (ipAddress && (!session.ipAddress || session.ipAddress !== ipAddress)) {
    updateData.ipAddress = ipAddress;
  }
  if (userAgent && (!session.userAgent || session.userAgent !== userAgent)) {
    updateData.userAgent = userAgent;
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: updateData,
  });

  return {
    userId: session.user.id,
    nickname: session.user.nickname,
    sessionToken: session.sessionToken,
    isGlobalAdmin: session.user.isGlobalAdmin,
  };
}

/**
 * Updates a user's nickname, ensuring uniqueness and preserving admin status/identity.
 */
export async function updateUserNickname(
  userId: string,
  newNickname: string
): Promise<{ id: string; nickname: string; isGlobalAdmin: boolean }> {
  const sanitizedNick = (newNickname || '').trim().slice(0, 24);
  if (sanitizedNick.length < 2) {
    throw new Error('A nicknévnek legalább 2 karakter hosszúnak kell lennie.');
  }

  // Check if nickname is already taken by ANOTHER user (case-insensitive)
  const existingUser = await prisma.user.findFirst({
    where: {
      nickname: {
        equals: sanitizedNick,
        mode: 'insensitive',
      },
      id: {
        not: userId,
      },
    },
  });

  if (existingUser) {
    throw new Error(`A(z) "${sanitizedNick}" nicknév már foglalt egy másik felhasználó által.`);
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser) {
    throw new Error('Felhasználó nem található.');
  }

  const oldNick = currentUser.nickname;

  // Update user in database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      nickname: sanitizedNick,
      updatedAt: new Date(),
    },
  });

  // If this user is the master admin, update master_admin_config
  try {
    const { updateAdminUsername } = await import('./adminAuth');
    await updateAdminUsername(userId, sanitizedNick);
  } catch (err) {
    console.error('Failed to sync master admin config on nickname change:', err);
  }

  // Record audit log
  try {
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        userNick: sanitizedNick,
        action: 'UPDATE_NICKNAME',
        details: JSON.stringify({ oldNickname: oldNick, newNickname: sanitizedNick }),
      },
    });
  } catch (err) {
    console.error('Failed to record audit log on nickname change:', err);
  }

  return {
    id: updatedUser.id,
    nickname: updatedUser.nickname,
    isGlobalAdmin: updatedUser.isGlobalAdmin,
  };
}
