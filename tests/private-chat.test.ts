import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { createRoom } from '../src/lib/room';
import { RoomType, Role } from '@prisma/client';

describe('Admin Private Chat & Whispers', () => {
  let roomId: string;
  let adminUser: { id: string; nickname: string };
  let targetUser: { id: string; nickname: string };
  let thirdPartyUser: { id: string; nickname: string };

  beforeAll(async () => {
    adminUser = await prisma.user.create({ data: { nickname: 'AdminBoss', isGlobalAdmin: true } });
    targetUser = await prisma.user.create({ data: { nickname: 'UserInNeed' } });
    thirdPartyUser = await prisma.user.create({ data: { nickname: 'InnocentBystander' } });

    const room = await createRoom({
      name: 'Private Chat Test Room',
      type: RoomType.PUBLIC,
      userId: adminUser.id,
    });
    roomId = room.room.id;
  });

  afterAll(async () => {
    await prisma.chatMessage.deleteMany({ where: { roomId } });
    await prisma.room.deleteMany({ where: { id: roomId } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminUser.id, targetUser.id, thirdPartyUser.id] } },
    });
  });

  it('saves private whisper message with recipient details and isPrivate flag', async () => {
    const whisper = await prisma.chatMessage.create({
      data: {
        roomId,
        userId: adminUser.id,
        senderNick: adminUser.nickname,
        senderRole: Role.ADMIN,
        message: 'Szia, kérlek ne spamelj a közös chatben!',
        isPrivate: true,
        recipientId: targetUser.id,
        recipientNick: targetUser.nickname,
      },
    });

    expect(whisper.isPrivate).toBe(true);
    expect(whisper.recipientId).toBe(targetUser.id);
    expect(whisper.recipientNick).toBe(targetUser.nickname);
  });

  it('allows public messages to be visible to all users', async () => {
    await prisma.chatMessage.create({
      data: {
        roomId,
        userId: thirdPartyUser.id,
        senderNick: thirdPartyUser.nickname,
        senderRole: Role.USER,
        message: 'Sziasztok, jó a zene!',
        isPrivate: false,
      },
    });

    const bystanderHistory = await prisma.chatMessage.findMany({
      where: {
        roomId,
        deletedAt: null,
        OR: [
          { isPrivate: false },
          { userId: thirdPartyUser.id },
          { recipientId: thirdPartyUser.id },
        ],
      },
    });

    // Bystander sees the public message, but NOT the private message between Admin and targetUser
    expect(bystanderHistory.length).toBe(1);
    expect(bystanderHistory[0].message).toBe('Sziasztok, jó a zene!');
  });

  it('allows both the sender (admin) and recipient (user) to see the private whisper', async () => {
    const adminHistory = await prisma.chatMessage.findMany({
      where: {
        roomId,
        deletedAt: null,
        OR: [
          { isPrivate: false },
          { userId: adminUser.id },
          { recipientId: adminUser.id },
        ],
      },
    });

    const recipientHistory = await prisma.chatMessage.findMany({
      where: {
        roomId,
        deletedAt: null,
        OR: [
          { isPrivate: false },
          { userId: targetUser.id },
          { recipientId: targetUser.id },
        ],
      },
    });

    expect(adminHistory.some((m) => m.isPrivate && m.recipientId === targetUser.id)).toBe(true);
    expect(recipientHistory.some((m) => m.isPrivate && m.userId === adminUser.id)).toBe(true);
  });
});
