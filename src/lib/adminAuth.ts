import crypto from 'crypto';
import prisma from './prisma';
import { createSessionForNickname, generateToken } from './session';

const ADMIN_CONFIG_KEY = 'master_admin_config';

export interface AdminConfig {
  userId: string;
  username: string;
  salt: string;
  hash: string;
  createdAt: string;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export async function getAdminConfig(): Promise<AdminConfig | null> {
  const setting = await prisma.appSettings.findUnique({
    where: { key: ADMIN_CONFIG_KEY },
  });
  if (!setting) return null;
  try {
    return JSON.parse(setting.value);
  } catch {
    return null;
  }
}

/**
 * Checks whether the permanent admin account has been initialized.
 */
export async function isAdminInitialized(): Promise<{ initialized: boolean; username?: string }> {
  const config = await getAdminConfig();
  if (!config) {
    return { initialized: false };
  }
  return { initialized: true, username: config.username };
}

/**
 * First-time setup for the permanent master admin.
 */
export async function setupInitialAdmin(nickname: string, password: string) {
  const config = await getAdminConfig();
  if (config) {
    throw new Error('Az admin fiók már be van állítva. Kérlek, jelentkezz be a meglévő jelszavaddal!');
  }

  const cleanNick = (nickname || 'Admin').trim().slice(0, 24);
  if (cleanNick.length < 2) {
    throw new Error('A nicknév legalább 2 karakter hosszú legyen.');
  }

  if (!password || password.length < 4) {
    throw new Error('A jelszó legalább 4 karakter hosszú legyen.');
  }

  // 1. Create or find User
  let user = await prisma.user.findFirst({
    where: { nickname: cleanNick },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        nickname: cleanNick,
        isGlobalAdmin: true,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isGlobalAdmin: true },
    });
  }

  // 2. Hash password
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);

  const adminData: AdminConfig = {
    userId: user.id,
    username: cleanNick,
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };

  await prisma.appSettings.upsert({
    where: { key: ADMIN_CONFIG_KEY },
    update: { value: JSON.stringify(adminData) },
    create: {
      key: ADMIN_CONFIG_KEY,
      value: JSON.stringify(adminData),
    },
  });

  // 3. Create persistent session
  const sessionToken = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
  await prisma.userSession.create({
    data: {
      sessionToken,
      userId: user.id,
      expiresAt,
    },
  });

  // 4. Record audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userNick: user.nickname,
      action: 'INIT_PERMANENT_ADMIN',
      details: JSON.stringify({ username: cleanNick }),
    },
  });

  return { sessionToken, user };
}

/**
 * Verifies admin password and issues a global admin session.
 */
export async function loginPermanentAdmin(password: string, sessionToken?: string) {
  const config = await getAdminConfig();
  if (!config) {
    throw new Error('Az admin fiók még nincs beállítva. Kérlek, előbb végezd el az első beállítást!');
  }

  const incomingHash = hashPassword(password, config.salt);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(incomingHash, 'hex'),
    Buffer.from(config.hash, 'hex')
  );

  if (!isValid) {
    throw new Error('Hibás admin jelszó!');
  }

  // Ensure user is marked as global admin
  let user = await prisma.user.findUnique({
    where: { id: config.userId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: config.userId,
        nickname: config.username,
        isGlobalAdmin: true,
      },
    });
  } else if (!user.isGlobalAdmin) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isGlobalAdmin: true },
    });
  }

  // Create new session or refresh existing
  const newSessionToken = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

  await prisma.userSession.create({
    data: {
      sessionToken: newSessionToken,
      userId: user.id,
      expiresAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userNick: user.nickname,
      action: 'ADMIN_LOGIN',
      details: JSON.stringify({ timestamp: new Date().toISOString() }),
    },
  });

  return { sessionToken: newSessionToken, user };
}

/**
 * Updates the stored master admin username in AppSettings if the user is the master admin.
 */
export async function updateAdminUsername(userId: string, newUsername: string): Promise<boolean> {
  const config = await getAdminConfig();
  if (config && config.userId === userId) {
    config.username = newUsername;
    await prisma.appSettings.update({
      where: { key: ADMIN_CONFIG_KEY },
      data: { value: JSON.stringify(config) },
    });
    return true;
  }
  return false;
}
