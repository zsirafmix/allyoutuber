import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { createRoom } from '../src/lib/room';
import { removeQueueItem } from '../src/lib/queue';
import { RoomType } from '@prisma/client';

describe('Role & Moderation Permissions', () => {
  let roomId: string;
  let normalUser: { id: string; nickname: string };
  let otherUser: { id: string; nickname: string };
  let queueItem: any;

  beforeAll(async () => {
    normalUser = await prisma.user.create({ data: { nickname: 'Alice' } });
    otherUser = await prisma.user.create({ data: { nickname: 'Bob' } });

    const created = await createRoom({
      name: 'Permission Test Room',
      type: RoomType.PUBLIC,
      userId: normalUser.id,
    });
    roomId = created.room.id;

    // Bob creates a queue item
    queueItem = await prisma.queueItem.create({
      data: {
        roomId,
        videoId: 'bobvideoid1',
        title: 'Bobs Video',
        duration: 180,
        thumbnailUrl: '',
        submittedById: otherUser.id,
        submittedNick: otherUser.nickname,
      },
    });
  });

  afterAll(async () => {
    await prisma.room.deleteMany({ where: { id: roomId } });
    await prisma.user.deleteMany({ where: { id: { in: [normalUser.id, otherUser.id] } } });
  });

  it('prevents regular USER from deleting another user queue item', async () => {
    await expect(
      removeQueueItem(roomId, queueItem.id, normalUser.id, false) // isModOrAdmin = false
    ).rejects.toThrow('You do not have permission to delete this queue item.');
  });

  it('allows MODERATOR or ADMIN to delete any queue item', async () => {
    const success = await removeQueueItem(roomId, queueItem.id, normalUser.id, true); // isModOrAdmin = true
    expect(success).toBe(true);

    const deleted = await prisma.queueItem.findUnique({ where: { id: queueItem.id } });
    expect(deleted).toBeNull();
  });
});
