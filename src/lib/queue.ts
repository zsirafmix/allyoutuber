import prisma from './prisma';
import { QueueMode, VideoSource, Role } from '@prisma/client';
import { ExtractedVideoInfo } from './youtube';

export interface AddToQueueInput {
  roomId: string;
  userId: string;
  userNick: string;
  video: ExtractedVideoInfo;
  source?: VideoSource;
}

export async function getRoomQueue(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { settings: true },
  });
  if (!room) throw new Error('Room not found.');

  const mode = room.settings?.queueMode || QueueMode.FIFO;

  let items = await prisma.queueItem.findMany({
    where: { roomId },
    include: {
      votes: true,
      submittedBy: { select: { id: true, nickname: true } },
    },
    orderBy: { position: 'asc' },
  });

  // Apply sorting depending on queue mode
  if (mode === QueueMode.VOTE) {
    items = items.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.position - b.position;
    });
  } else if (mode === QueueMode.HYBRID) {
    const now = Date.now();
    items = items.sort((a, b) => {
      // Hybrid formula: voteScore * 10 + (age in minutes) - (consecutive penalty)
      const ageA = (now - new Date(a.submittedAt).getTime()) / 60000;
      const ageB = (now - new Date(b.submittedAt).getTime()) / 60000;
      const weightA = a.score * 10 + ageA;
      const weightB = b.score * 10 + ageB;
      if (weightB !== weightA) return weightB - weightA;
      return a.position - b.position;
    });
  }

  return items;
}

/**
 * Validates queue limits and appends a video to the room's queue.
 */
export async function addToQueue(input: AddToQueueInput) {
  const { roomId, userId, userNick, video, source = VideoSource.USER } = input;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      settings: true,
      queueItems: {
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!room) throw new Error('Room not found.');
  const settings = room.settings;

  // 1. Duration limit check
  if (settings && settings.maxVideoDurationMinutes > 0) {
    const maxSec = settings.maxVideoDurationMinutes * 60;
    if (video.duration > maxSec) {
      throw new Error(
        `Video is too long (${Math.round(video.duration / 60)} min). The limit in this room is ${settings.maxVideoDurationMinutes} minutes.`
      );
    }
  }

  // 2. Shorts check
  if (settings && !settings.allowShorts && video.duration <= 60) {
    throw new Error('YouTube Shorts are disabled in this room.');
  }

  // If added by regular USER, enforce user-specific limits
  if (source === VideoSource.USER) {
    const existingQueue = room.queueItems;

    // A. User queue quota (maxQueuedVideosPerUser, default 5)
    const userQueuedCount = existingQueue.filter((item) => item.submittedById === userId).length;
    const maxPerUser = settings?.maxQueuedVideosPerUser || 5;
    if (userQueuedCount >= maxPerUser) {
      throw new Error(`You have reached the maximum of ${maxPerUser} pending videos in the queue.`);
    }

    // B. Consecutive video limit (default 2)
    // Check the trailing items currently in queue
    const consecutiveLimit = settings?.maxConsecutiveVideosPerUser || 2;
    if (consecutiveLimit > 0 && existingQueue.length >= consecutiveLimit) {
      const lastN = existingQueue.slice(-consecutiveLimit);
      const allByUser = lastN.every((item) => item.submittedById === userId);
      if (allByUser) {
        throw new Error(
          `Már két videód következik egymás után. Várd meg, amíg más is hozzáad egy videót.`
        );
      }
    }
  }

  // 3. User priority over DJ tracks:
  // If user adds a track and the last items in the queue are automated DJ tracks,
  // the user video can be inserted before unplayed DJ tracks!
  let newPosition = room.queueItems.length;
  if (source === VideoSource.USER) {
    // Find if there are DJ items at the end
    const lastDjIndex = room.queueItems.findIndex((item) => item.source === VideoSource.DJ);
    if (lastDjIndex !== -1) {
      newPosition = lastDjIndex;
      // Shift positions of subsequent DJ items
      await prisma.queueItem.updateMany({
        where: { roomId, position: { gte: newPosition } },
        data: { position: { increment: 1 } },
      });
    }
  }

  // 4. Create QueueItem
  const queueItem = await prisma.queueItem.create({
    data: {
      roomId,
      videoId: video.videoId,
      title: video.title,
      duration: video.duration,
      thumbnailUrl: video.thumbnailUrl,
      submittedById: source === VideoSource.DJ || userId === "system-dj" ? null : userId,
      submittedNick: userNick,
      source,
      position: newPosition,
      score: 0,
    },
  });

  return queueItem;
}

/**
 * Removes an item from the queue, enforcing ownership or moderator permissions.
 */
export async function removeQueueItem(roomId: string, queueItemId: string, userId: string, isModOrAdmin: boolean) {
  const item = await prisma.queueItem.findUnique({
    where: { id: queueItemId },
  });

  if (!item || item.roomId !== roomId) {
    throw new Error('Queue item not found.');
  }

  if (item.submittedById !== userId && !isModOrAdmin) {
    throw new Error('You do not have permission to delete this queue item.');
  }

  await prisma.queueItem.delete({
    where: { id: queueItemId },
  });

  // Re-normalize positions
  const remaining = await prisma.queueItem.findMany({
    where: { roomId },
    orderBy: { position: 'asc' },
  });

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].position !== i) {
      await prisma.queueItem.update({
        where: { id: remaining[i].id },
        data: { position: i },
      });
    }
  }

  return true;
}

/**
 * Reorders a queue item (Move Up / Move Down / Play Next).
 */
export async function reorderQueueItem(roomId: string, queueItemId: string, targetPosition: number) {
  const items = await prisma.queueItem.findMany({
    where: { roomId },
    orderBy: { position: 'asc' },
  });

  const currentIndex = items.findIndex((i) => i.id === queueItemId);
  if (currentIndex === -1) throw new Error('Queue item not found.');

  const [moved] = items.splice(currentIndex, 1);
  const safeTarget = Math.max(0, Math.min(targetPosition, items.length));
  items.splice(safeTarget, 0, moved);

  for (let i = 0; i < items.length; i++) {
    await prisma.queueItem.update({
      where: { id: items[i].id },
      data: { position: i },
    });
  }

  return items;
}

/**
 * Pops the next video according to room settings and updates PlaybackState and PlaybackHistory.
 */
export async function popNextVideo(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      settings: true,
      playbackState: true,
    },
  });

  if (!room) return null;

  // 1. If currently playing a video, archive it to PlaybackHistory
  if (room.playbackState?.currentVideoId) {
    await prisma.playbackHistory.create({
      data: {
        roomId,
        videoId: room.playbackState.currentVideoId,
        title: room.playbackState.currentTitle || 'Unknown Title',
        duration: room.playbackState.currentDuration || 0,
        thumbnailUrl: room.playbackState.currentThumbnail || '',
        submittedById: null,
        submittedNick: room.playbackState.currentSubmittedBy || 'User',
        source: room.playbackState.currentSource,
        votes: 0,
        playedAt: new Date(),
      },
    });
  }

  // 2. Fetch queue items according to queue mode
  const queue = await getRoomQueue(roomId);
  if (queue.length === 0) {
    // Queue is empty
    return null;
  }

  // Pick top item
  const nextItem = queue[0];

  // Update PlaybackState
  const updatedPlayback = await prisma.playbackState.upsert({
    where: { roomId },
    update: {
      currentVideoId: nextItem.videoId,
      currentTitle: nextItem.title,
      currentDuration: nextItem.duration,
      currentThumbnail: nextItem.thumbnailUrl,
      currentSubmittedBy: nextItem.submittedNick,
      currentSource: nextItem.source,
      startedAt: new Date(),
      paused: false,
      currentPosition: 0,
    },
    create: {
      roomId,
      currentVideoId: nextItem.videoId,
      currentTitle: nextItem.title,
      currentDuration: nextItem.duration,
      currentThumbnail: nextItem.thumbnailUrl,
      currentSubmittedBy: nextItem.submittedNick,
      currentSource: nextItem.source,
      startedAt: new Date(),
      paused: false,
      currentPosition: 0,
    },
  });

  // Delete from QueueItem
  await prisma.queueItem.delete({
    where: { id: nextItem.id },
  });

  // Re-index remaining queue positions
  const remaining = await prisma.queueItem.findMany({
    where: { roomId },
    orderBy: { position: 'asc' },
  });

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].position !== i) {
      await prisma.queueItem.update({
        where: { id: remaining[i].id },
        data: { position: i },
      });
    }
  }

  return { nextItem, playbackState: updatedPlayback };
}
