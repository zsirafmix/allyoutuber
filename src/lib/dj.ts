import prisma from './prisma';
import { DJMode, VideoSource } from '@prisma/client';
import { addToQueue } from './queue';
import { getYouTubeMetadata } from './youtube';

const GLOBAL_DEFAULT_DJ_IDS = [
  'fJ9rUzIMcZQ', // Queen - Bohemian Rhapsody
  'kJQP7kiw5Fk', // Luis Fonsi - Despacito
  'kXYiU_JCYtU', // Linkin Park - Numb
  'hT_nvWreIhg', // OneRepublic - Counting Stars
  'OPf0YbXqDm0', // Mark Ronson - Uptown Funk
  'JGwWNGJdvx8', // Ed Sheeran - Shape of You
  'YQHsXMglC9A', // Adele - Hello
  '09R8_2nJtjg', // Maroon 5 - Sugar
  'CevxZvSJLk8', // Katy Perry - Roar
  'RgKAFK5djSk', // Wiz Khalifa - See You Again
];

/**
 * Checks and automatically refills the room queue using DJ tracks if conditions are met.
 */
export async function checkAndRefillDJ(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      settings: true,
      queueItems: { orderBy: { position: 'asc' } },
      playbackState: true,
    },
  });

  if (!room || !room.settings) return null;
  const { djMode, djMinimumQueueLength, djRepeatProtectionCount, djPlaylist } = room.settings;

  if (djMode === DJMode.OFF) {
    return null;
  }

  const currentQueueLength = room.queueItems.length;
  const shouldAdd =
    (djMode === DJMode.AUTO && currentQueueLength < djMinimumQueueLength) ||
    (djMode === DJMode.ALWAYS && currentQueueLength < djMinimumQueueLength + 1);

  if (!shouldAdd) {
    return null;
  }

  // 1. Gather candidate track IDs
  let candidates: string[] = [];
  if (djPlaylist) {
    try {
      const parsed = JSON.parse(djPlaylist);
      if (Array.isArray(parsed) && parsed.length > 0) {
        candidates = parsed;
      }
    } catch {
      candidates = djPlaylist.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  if (candidates.length === 0) {
    candidates = [...GLOBAL_DEFAULT_DJ_IDS];
  }

  // 2. Repeat protection: fetch last N played videos in this room
  const repeatLimit = Math.max(1, djRepeatProtectionCount || 20);
  const recentHistory = await prisma.playbackHistory.findMany({
    where: { roomId },
    orderBy: { playedAt: 'desc' },
    take: repeatLimit,
    select: { videoId: true },
  });

  const recentVideoIds = new Set(recentHistory.map((h) => h.videoId));

  // Also exclude currently playing and currently queued video IDs
  if (room.playbackState?.currentVideoId) {
    recentVideoIds.add(room.playbackState.currentVideoId);
  }
  for (const item of room.queueItems) {
    recentVideoIds.add(item.videoId);
  }

  // Filter candidates not played recently or currently active
  let eligible = candidates.filter((id) => !recentVideoIds.has(id));

  // Fallback: If all candidates are blocked, pick the least recently played candidate
  if (eligible.length === 0) {
    const notQueued = candidates.filter(
      (id) =>
        id !== room.playbackState?.currentVideoId &&
        !room.queueItems.some((q) => q.videoId === id)
    );
    eligible = notQueued.length > 0 ? notQueued : candidates;
  }

  // Pick random or next eligible candidate
  const chosenVideoId = eligible[Math.floor(Math.random() * eligible.length)];
  if (!chosenVideoId) return null;

  // Retrieve metadata
  const meta = await getYouTubeMetadata(chosenVideoId);

  // Add to queue with DJ attribution
  const item = await addToQueue({
    roomId,
    userId: 'system-dj',
    userNick: '🤖 DJ',
    video: meta,
    source: VideoSource.DJ,
  });

  return item;
}
