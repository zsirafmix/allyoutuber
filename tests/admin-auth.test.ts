import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import {
  isAdminInitialized,
  setupInitialAdmin,
  loginPermanentAdmin,
} from '../src/lib/adminAuth';
import { updateUserNickname, getSession } from '../src/lib/session';

describe('Permanent Master Admin & Password System', () => {
  beforeAll(async () => {
    // Clear any previous master admin config and test users for test isolation
    await prisma.appSettings.deleteMany({ where: { key: 'master_admin_config' } });
    await prisma.userSession.deleteMany({
      where: { user: { nickname: { in: ['ZsirafMaster', 'ZsirafTheBoss', 'Attacker'] } } },
    });
    await prisma.user.deleteMany({
      where: { nickname: { in: ['ZsirafMaster', 'ZsirafTheBoss', 'Attacker'] } },
    });
  });

  afterAll(async () => {
    await prisma.appSettings.deleteMany({ where: { key: 'master_admin_config' } });
    await prisma.userSession.deleteMany({
      where: { user: { nickname: { in: ['ZsirafMaster', 'ZsirafTheBoss', 'Attacker'] } } },
    });
    await prisma.user.deleteMany({
      where: { nickname: { in: ['ZsirafMaster', 'ZsirafTheBoss', 'Attacker'] } },
    });
  });

  it('detects uninitialized admin on first run', async () => {
    const status = await isAdminInitialized();
    expect(status.initialized).toBe(false);
  });

  it('sets up permanent admin with hashed password on first run', async () => {
    const { sessionToken, user } = await setupInitialAdmin('ZsirafMaster', 'mesterJelszo2026');
    expect(sessionToken).toBeTruthy();
    expect(user.nickname).toBe('ZsirafMaster');
    expect(user.isGlobalAdmin).toBe(true);

    const status = await isAdminInitialized();
    expect(status.initialized).toBe(true);
    expect(status.username).toBe('ZsirafMaster');
  });

  it('prevents second setup once initialized', async () => {
    await expect(
      setupInitialAdmin('Attacker', 'hackedpass')
    ).rejects.toThrow('Az admin fiók már be van állítva');
  });

  it('rejects wrong password upon login', async () => {
    await expect(
      loginPermanentAdmin('rosszJelszo')
    ).rejects.toThrow('Hibás admin jelszó');
  });

  it('authenticates with correct password and grants global admin access', async () => {
    const { sessionToken, user } = await loginPermanentAdmin('mesterJelszo2026');
    expect(sessionToken).toBeTruthy();
    expect(user.isGlobalAdmin).toBe(true);
  });

  it('allows master admin to change their own nickname while retaining admin privileges and updating settings', async () => {
    const { sessionToken, user } = await loginPermanentAdmin('mesterJelszo2026');

    // Admin renames self to 'ZsirafTheBoss'
    const updated = await updateUserNickname(user.id, 'ZsirafTheBoss');
    expect(updated.nickname).toBe('ZsirafTheBoss');
    expect(updated.isGlobalAdmin).toBe(true);
    expect(updated.id).toBe(user.id);

    // Verify session retrieval returns updated nickname with admin flag intact
    const refreshedSession = await getSession(sessionToken);
    expect(refreshedSession?.nickname).toBe('ZsirafTheBoss');
    expect(refreshedSession?.isGlobalAdmin).toBe(true);

    // Verify AppSettings master_admin_config has been updated with the new username
    const status = await isAdminInitialized();
    expect(status.initialized).toBe(true);
    expect(status.username).toBe('ZsirafTheBoss');

    // Verify that subsequent password login works with the updated nickname
    const relogin = await loginPermanentAdmin('mesterJelszo2026');
    expect(relogin.user.nickname).toBe('ZsirafTheBoss');
    expect(relogin.user.isGlobalAdmin).toBe(true);
  });
});
