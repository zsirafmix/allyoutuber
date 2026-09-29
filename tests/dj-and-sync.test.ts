import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { createRoom } from '../src/lib/room';
import { checkAndRefillDJ } from '../src/lib/dj';
import { DJMode, RoomType, VideoSource } from '@prisma/client';

describe('Automated DJ Engine & Repeat Protection', () => {
  let roomId: string;
  let adminUser: { id: string; nickname: string };

  beforeAll(async () => {
    adminUser = await prisma.user.create({ data: { nickname: 'DJAdmin' } });
    const created = await createRoom({
      name: 'DJ Test Room',
      type: RoomType.PUBLIC,
      userId: adminUser.id,
    });
    roomId = created.room.id;
  });

  afterAll(async () => {
    await prisma.room.deleteMany({ where: { id: roomId } });
    await prisma.user.deleteMany({ where: { id: adminUser.id } });
  });

  it('automatically adds a DJ track when queue falls below minimum length', async () => {
    // Make sure VideoMetadata exists for DJ candidate
    await prisma.videoMetadata.upsert({
      where: { id: 'fJ9rUzIMcZQ' },
      update: {},
      create: {
        id: 'fJ9rUzIMcZQ',
        title: 'Queen - Bohemian Rhapsody',
        duration: 355,
        thumbnailUrl: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
      },
    });

    await prisma.roomSettings.update({
      where: { roomId },
      data: {
        djMode: DJMode.AUTO,
        djMinimumQueueLength: 2,
        djPlaylist: JSON.stringify(['fJ9rUzIMcZQ']),
      },
    });

    // Queue is empty, refill DJ
    const djItem = await checkAndRefillDJ(roomId);
    expect(djItem).not.toBeNull();
    expect(djItem?.source).toBe(VideoSource.DJ);
    expect(djItem?.submittedNick).toBe('🤖 DJ');
    expect(djItem?.videoId).toBe('fJ9rUzIMcZQ');
  });

  it('enforces repeat protection from playback history', async () => {
    const candidateA = 'kXYiU_JCYtU';
    const candidateB = 'OPf0YbXqDm0';

    await prisma.videoMetadata.upsert({
      where: { id: candidateA },
      update: {},
      create: { id: candidateA, title: 'Track A', duration: 200, thumbnailUrl: '' },
    });
    await prisma.videoMetadata.upsert({
      where: { id: candidateB },
      update: {},
      create: { id: candidateB, title: 'Track B', duration: 200, thumbnailUrl: '' },
    });

    // Record candidateA in recent PlaybackHistory
    await prisma.playbackHistory.create({
      data: {
        roomId,
        videoId: candidateA,
        title: 'Track A',
        duration: 200,
        thumbnailUrl: '',
        submittedNick: 'DJ',
        playedAt: new Date(),
      },
    });

    // Set playlist to both candidateA and candidateB
    await prisma.roomSettings.update({
      where: { roomId },
      data: {
        djMode: DJMode.AUTO,
        djMinimumQueueLength: 5,
        djRepeatProtectionCount: 20,
        djPlaylist: JSON.stringify([candidateA, candidateB]),
      },
    });

    // DJ must pick candidateB because candidateA was just played!
    const djItem = await checkAndRefillDJ(roomId);
    expect(djItem?.videoId).toBe(candidateB);
  });
});
