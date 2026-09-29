import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import {
  isAdminInitialized,
  setupInitialAdmin,
  loginPermanentAdmin,
} from '../src/lib/adminAuth';

describe('Permanent Master Admin & Password System', () => {
  beforeAll(async () => {
    // Clear any previous master admin config for test isolation
    await prisma.appSettings.deleteMany({ where: { key: 'master_admin_config' } });
  });

  afterAll(async () => {
    await prisma.appSettings.deleteMany({ where: { key: 'master_admin_config' } });
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
});
