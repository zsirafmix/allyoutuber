import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { createRoom, validateRoomAccess, regenerateRoomInvite } from '../src/lib/room';
import { generateInviteCode, hashInviteCode } from '../src/lib/session';
import { RoomType, Role } from '@prisma/client';

describe('Room & Private Invite System', () => {
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { nickname: 'InviteTester' },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('generates valid 8-character invite code format (XXXX-XXXX)', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}$/);
  });

  it('creates private room with hashed invite code and validates correctly', async () => {
    const { room, inviteCode } = await createRoom({
      name: 'Secret Party',
      type: RoomType.PRIVATE,
      userId: testUserId,
    });

    expect(room.type).toBe(RoomType.PRIVATE);
    expect(inviteCode).toBeTruthy();

    // Check with correct invite code
    const validAccess = await validateRoomAccess(room, 'external-guest', inviteCode!);
    expect(validAccess.allowed).toBe(true);

    // Check with wrong invite code
    const invalidAccess = await validateRoomAccess(room, 'external-guest', 'WRONG-CODE');
    expect(invalidAccess.allowed).toBe(false);
    expect(invalidAccess.reason).toContain('Invalid or expired');

    // Clean up
    await prisma.room.delete({ where: { id: room.id } });
  });

  it('invalidates previous invite code upon regeneration', async () => {
    const { room, inviteCode: firstCode } = await createRoom({
      name: 'VIP Lounge',
      type: RoomType.PRIVATE,
      userId: testUserId,
    });

    // Verify first code works
    const access1 = await validateRoomAccess(room, 'guest-1', firstCode!);
    expect(access1.allowed).toBe(true);

    // Regenerate code
    const newCode = await regenerateRoomInvite(room.id, testUserId);
    expect(newCode).not.toBe(firstCode);

    // Old code must now be rejected
    const oldAccess = await validateRoomAccess(room, 'guest-2', firstCode!);
    expect(oldAccess.allowed).toBe(false);

    // New code must be accepted
    const newAccess = await validateRoomAccess(room, 'guest-2', newCode);
    expect(newAccess.allowed).toBe(true);

    // Clean up
    await prisma.room.delete({ where: { id: room.id } });
  });

  it('strictly isolates data and queues between rooms', async () => {
    const roomA = await createRoom({ name: 'Room Alpha', type: RoomType.PUBLIC, userId: testUserId });
    const roomB = await createRoom({ name: 'Room Beta', type: RoomType.PUBLIC, userId: testUserId });

    await prisma.queueItem.create({
      data: {
        roomId: roomA.room.id,
        videoId: 'fJ9rUzIMcZQ',
        title: 'Track in A',
        duration: 200,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        submittedNick: 'Tester',
      },
    });

    const queueA = await prisma.queueItem.findMany({ where: { roomId: roomA.room.id } });
    const queueB = await prisma.queueItem.findMany({ where: { roomId: roomB.room.id } });

    expect(queueA.length).toBe(1);
    expect(queueB.length).toBe(0);

    await prisma.room.delete({ where: { id: roomA.room.id } });
    await prisma.room.delete({ where: { id: roomB.room.id } });
  });
});
