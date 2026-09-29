import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { createRoom } from '../src/lib/room';
import { castVote } from '../src/lib/vote';
import { getRoomQueue } from '../src/lib/queue';
import { RoomType, QueueMode } from '@prisma/client';

describe('Real-Time Voting & Queue Ordering Modes', () => {
  let roomId: string;
  let user1: { id: string; nickname: string };
  let user2: { id: string; nickname: string };
  let itemA: any;
  let itemB: any;

  beforeAll(async () => {
    user1 = await prisma.user.create({ data: { nickname: 'Voter1' } });
    user2 = await prisma.user.create({ data: { nickname: 'Voter2' } });

    const created = await createRoom({
      name: 'Voting Test Room',
      type: RoomType.PUBLIC,
      userId: user1.id,
    });
    roomId = created.room.id;

    // Create 2 queue items
    itemA = await prisma.queueItem.create({
      data: {
        roomId,
        videoId: 'vidAAAAAAA',
        title: 'Track A',
        duration: 200,
        thumbnailUrl: '',
        submittedNick: 'User 1',
        position: 0,
        score: 0,
      },
    });

    itemB = await prisma.queueItem.create({
      data: {
        roomId,
        videoId: 'vidBBBBBBB',
        title: 'Track B',
        duration: 200,
        thumbnailUrl: '',
        submittedNick: 'User 2',
        position: 1,
        score: 0,
      },
    });
  });

  afterAll(async () => {
    await prisma.room.deleteMany({ where: { id: roomId } });
    await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });
  });

  it('casts upvote and modifies score', async () => {
    const res = await castVote({
      roomId,
      queueItemId: itemB.id,
      userId: user1.id,
      value: 1,
    });

    expect(res.score).toBe(1);
    expect(res.userVote).toBe(1);
  });

  it('retracts vote when clicking the same vote again', async () => {
    const res = await castVote({
      roomId,
      queueItemId: itemB.id,
      userId: user1.id,
      value: 1,
    });

    // Score should return to 0
    expect(res.score).toBe(0);
    expect(res.userVote).toBe(0);
  });

  it('switches vote from upvote to downvote', async () => {
    await castVote({ roomId, queueItemId: itemB.id, userId: user1.id, value: 1 });
    const res = await castVote({ roomId, queueItemId: itemB.id, userId: user1.id, value: -1 });

    expect(res.score).toBe(-1);
    expect(res.userVote).toBe(-1);
  });

  it('orders queue by vote score descending when room queueMode is VOTE', async () => {
    // Upvote Item B with 2 users so it has score +2
    await castVote({ roomId, queueItemId: itemB.id, userId: user1.id, value: 1 });
    await castVote({ roomId, queueItemId: itemB.id, userId: user2.id, value: 1 });

    // Set room queueMode to VOTE
    await prisma.roomSettings.update({
      where: { roomId },
      data: { queueMode: QueueMode.VOTE },
    });

    const ordered = await getRoomQueue(roomId);
    expect(ordered[0].id).toBe(itemB.id); // Item B has higher score and moves to top
    expect(ordered[1].id).toBe(itemA.id);
  });
});
