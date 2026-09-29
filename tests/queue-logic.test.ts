import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { createRoom } from '../src/lib/room';
import { addToQueue } from '../src/lib/queue';
import { RoomType, VideoSource } from '@prisma/client';

describe('Video Queue Limits & Business Rules', () => {
  let roomId: string;
  let userA: { id: string; nickname: string };
  let userB: { id: string; nickname: string };

  beforeAll(async () => {
    userA = await prisma.user.create({ data: { nickname: 'Zsiraf' } });
    userB = await prisma.user.create({ data: { nickname: 'Anna' } });

    const created = await createRoom({
      name: 'Queue Test Room',
      type: RoomType.PUBLIC,
      userId: userA.id,
    });
    roomId = created.room.id;
  });

  afterAll(async () => {
    await prisma.room.deleteMany({ where: { id: roomId } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  });

  it('allows 2 consecutive videos by the same user, but blocks the 3rd consecutive video', async () => {
    // 1st video by User A
    await addToQueue({
      roomId,
      userId: userA.id,
      userNick: userA.nickname,
      video: { videoId: 'vid11111111', title: 'Video 1', duration: 180, thumbnailUrl: '' },
    });

    // 2nd consecutive video by User A
    await addToQueue({
      roomId,
      userId: userA.id,
      userNick: userA.nickname,
      video: { videoId: 'vid22222222', title: 'Video 2', duration: 180, thumbnailUrl: '' },
    });

    // 3rd consecutive video by User A must throw consecutive limit error
    await expect(
      addToQueue({
        roomId,
        userId: userA.id,
        userNick: userA.nickname,
        video: { videoId: 'vid33333333', title: 'Video 3', duration: 180, thumbnailUrl: '' },
      })
    ).rejects.toThrow('Már két videód következik egymás után. Várd meg, amíg más is hozzáad egy videót.');

    // User B adds a video, breaking the streak
    await addToQueue({
      roomId,
      userId: userB.id,
      userNick: userB.nickname,
      video: { videoId: 'vid44444444', title: 'Video 4 by Anna', duration: 180, thumbnailUrl: '' },
    });

    // Now User A can add another video!
    const video5 = await addToQueue({
      roomId,
      userId: userA.id,
      userNick: userA.nickname,
      video: { videoId: 'vid55555555', title: 'Video 5 by Zsiraf', duration: 180, thumbnailUrl: '' },
    });
    expect(video5.title).toBe('Video 5 by Zsiraf');
  });

  it('rejects videos exceeding the maximum duration limit', async () => {
    // Room has default limit of 15 minutes (900 seconds)
    await expect(
      addToQueue({
        roomId,
        userId: userB.id,
        userNick: userB.nickname,
        video: { videoId: 'toolongvid1', title: 'Hour Mix', duration: 1200, thumbnailUrl: '' },
      })
    ).rejects.toThrow('Video is too long');
  });

  it('gives user submissions priority over automated DJ filler tracks', async () => {
    // Add automated DJ track
    await addToQueue({
      roomId,
      userId: 'system-dj',
      userNick: '🤖 DJ',
      video: { videoId: 'djtrack0001', title: 'DJ Track', duration: 200, thumbnailUrl: '' },
      source: VideoSource.DJ,
    });

    // User B adds a track: must jump in front of the DJ track
    const userTrack = await addToQueue({
      roomId,
      userId: userB.id,
      userNick: userB.nickname,
      video: { videoId: 'usertrack01', title: 'User Priority Track', duration: 200, thumbnailUrl: '' },
      source: VideoSource.USER,
    });

    // Check positions
    const queue = await prisma.queueItem.findMany({
      where: { roomId },
      orderBy: { position: 'asc' },
    });

    const userIndex = queue.findIndex((item) => item.id === userTrack.id);
    const djIndex = queue.findIndex((item) => item.videoId === 'djtrack0001');

    expect(userIndex).toBeLessThan(djIndex);
  });
});
