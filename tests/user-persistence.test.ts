import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { createSessionForNickname, getSession, updateUserNickname } from '../src/lib/session';

describe('User Persistence & Identity Memory', () => {
  const testNick = 'PersistentDJ';
  let firstUserId: string;

  const cleanup = async () => {
    await prisma.userSession.deleteMany({
      where: {
        user: {
          nickname: { in: ['PersistentDJ', 'persistentdj', 'RenamedDJ', 'OtherDJ'], mode: 'insensitive' },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        nickname: { in: ['PersistentDJ', 'persistentdj', 'RenamedDJ', 'OtherDJ'], mode: 'insensitive' },
      },
    });
  };

  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('creates user on first nickname registration', async () => {
    const session1 = await createSessionForNickname(testNick);
    expect(session1.user.nickname).toBe(testNick);
    expect(session1.user.id).toBeDefined();
    expect(session1.sessionToken).toBeDefined();

    firstUserId = session1.user.id;
  });

  it('remembers and re-uses existing user record when reconnecting with the same nickname', async () => {
    // Connect again with same nickname (different casing, e.g. 'persistentdj')
    const session2 = await createSessionForNickname('persistentdj');

    expect(session2.user.id).toBe(firstUserId);
    expect(session2.sessionToken).toBeDefined();

    // Verify session retrieval
    const auth = await getSession(session2.sessionToken);
    expect(auth).not.toBeNull();
    expect(auth?.userId).toBe(firstUserId);
    expect(auth?.nickname.toLowerCase()).toBe(testNick.toLowerCase());
  });

  it('preserves user roles and global admin status across persistent logins', async () => {
    // Elevate user to global admin
    await prisma.user.update({
      where: { id: firstUserId },
      data: { isGlobalAdmin: true },
    });

    // Reconnect with nickname
    const session3 = await createSessionForNickname(testNick);
    expect(session3.user.id).toBe(firstUserId);
    expect(session3.user.isGlobalAdmin).toBe(true);

    const auth = await getSession(session3.sessionToken);
    expect(auth?.isGlobalAdmin).toBe(true);
  });

  it('updates nickname smoothly while keeping the same userId and admin rights', async () => {
    const updated = await updateUserNickname(firstUserId, 'RenamedDJ');
    expect(updated.id).toBe(firstUserId);
    expect(updated.nickname).toBe('RenamedDJ');
    expect(updated.isGlobalAdmin).toBe(true);

    const checkUser = await prisma.user.findUnique({ where: { id: firstUserId } });
    expect(checkUser?.nickname).toBe('RenamedDJ');
  });

  it('rejects nickname change if another user already owns the target nickname', async () => {
    // Create another user
    const otherUser = await createSessionForNickname('OtherDJ');
    expect(otherUser.user.id).not.toBe(firstUserId);

    // Attempting to rename firstUserId to 'OtherDJ' should throw collision error
    await expect(
      updateUserNickname(firstUserId, 'otherdj')
    ).rejects.toThrow('már foglalt egy másik felhasználó által');

    // Clean up otherUser
    await prisma.userSession.deleteMany({ where: { userId: otherUser.user.id } });
    await prisma.user.delete({ where: { id: otherUser.user.id } });
  });

  it('rejects nickname change if nickname is too short', async () => {
    await expect(
      updateUserNickname(firstUserId, 'A')
    ).rejects.toThrow('legalább 2 karakter');
  });
});
