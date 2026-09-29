import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { createSessionForNickname, getSession } from '../src/lib/session';

describe('User Persistence & Identity Memory', () => {
  const testNick = 'PersistentDJ';
  let firstUserId: string;

  afterAll(async () => {
    await prisma.userSession.deleteMany({
      where: { user: { nickname: { equals: testNick, mode: 'insensitive' } } },
    });
    await prisma.user.deleteMany({
      where: { nickname: { equals: testNick, mode: 'insensitive' } },
    });
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
});
