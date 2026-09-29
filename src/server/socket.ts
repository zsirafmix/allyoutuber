import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import prisma from '../lib/prisma';
import { getSession, updateUserNickname } from '../lib/session';
import { claimSlot, validateRoomAccess, regenerateRoomInvite } from '../lib/room';
import { getYouTubeMetadata } from '../lib/youtube';
import { addToQueue, getRoomQueue, popNextVideo, removeQueueItem, reorderQueueItem } from '../lib/queue';
import { checkAndRefillDJ } from '../lib/dj';
import { castVote } from '../lib/vote';
import { checkChatRateLimit, checkEmojiRateLimit, sanitizeText } from '../lib/rateLimit';
import { Role, VideoSource, DJMode } from '@prisma/client';
import {
  registerSocket,
  unregisterSocket,
  updateSocketSlot,
  updateUserSlotInRoom,
  updateUserRoleInRoom,
  updateUserNicknameInPresence,
  getRoomOnlineCount,
  getRoomParticipants,
  getAllRoomCounts,
  isUserOnlineInRoom,
} from '../lib/presence';

interface ConnectedUser {
  socketId: string;
  userId: string;
  nickname: string;
  roomId: string;
  role: Role;
  slotIndex: number | null;
}

const activeUsers = new Map<string, ConnectedUser>(); // socketId -> user
const roomClockIntervals = new Map<string, NodeJS.Timeout>();

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Background room playback clock ticker
  async function tickRoomPlayback(roomId: string) {
    try {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { playbackState: true, settings: true },
      });

      if (!room || !room.playbackState) return;
      const ps = room.playbackState;

      if (!ps.currentVideoId || ps.paused) {
        // If no video is currently playing, check if queue has items or DJ should refill
        const queue = await getRoomQueue(roomId);
        if (queue.length > 0) {
          const popped = await popNextVideo(roomId);
          if (popped) {
            await checkAndRefillDJ(roomId);
            await broadcastRoomState(roomId);
          }
        } else if (room.settings?.djMode !== DJMode.OFF) {
          const djItem = await checkAndRefillDJ(roomId);
          if (djItem) {
            const popped = await popNextVideo(roomId);
            if (popped) {
              await broadcastRoomState(roomId);
            }
          }
        }
        return;
      }

      // If playing, check elapsed time
      if (ps.startedAt && ps.currentDuration && ps.currentDuration > 0) {
        const elapsedSec = (Date.now() - new Date(ps.startedAt).getTime()) / 1000;
        if (elapsedSec >= ps.currentDuration) {
          // Video finished! Advance to next video
          const next = await popNextVideo(roomId);
          await checkAndRefillDJ(roomId);
          await broadcastRoomState(roomId);
        }
      }
    } catch (err) {
      console.error(`Playback ticker error in room ${roomId}:`, err);
    }
  }

  // Helper to broadcast room counts to lobby and specific rooms
  function broadcastCounts(roomId?: string) {
    try {
      const counts = getAllRoomCounts();
      io.emit('rooms:counts_update', counts);
      if (roomId) {
        const count = getRoomOnlineCount(roomId);
        io.to(`room:${roomId}`).emit('room:user_count_changed', {
          roomId,
          onlineCount: count,
        });
      }
    } catch (err) {
      console.error('Error broadcasting counts:', err);
    }
  }

  // Periodic room counts sync to all connected clients every 5 seconds
  setInterval(() => {
    broadcastCounts();
  }, 5000);

  // Broadcast full synchronized state to a room
  async function broadcastRoomState(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        settings: true,
        playbackState: true,
        members: {
          include: { user: true },
          orderBy: { slotIndex: 'asc' },
        },
      },
    });

    if (!room) return;

    const queue = await getRoomQueue(roomId);

    // Compute active playback position
    let currentPosition = 0;
    if (room.playbackState?.startedAt && !room.playbackState.paused) {
      currentPosition = Math.max(0, (Date.now() - new Date(room.playbackState.startedAt).getTime()) / 1000);
    }

    const onlineCount = getRoomOnlineCount(roomId);
    const onlineUsers = getRoomParticipants(roomId);

    io.to(`room:${roomId}`).emit('room:state_update', {
      room: {
        id: room.id,
        slug: room.slug,
        name: room.name,
        type: room.type,
        isLocked: room.isLocked,
      },
      settings: room.settings,
      playback: {
        videoId: room.playbackState?.currentVideoId || null,
        title: room.playbackState?.currentTitle || null,
        duration: room.playbackState?.currentDuration || 0,
        thumbnailUrl: room.playbackState?.currentThumbnail || null,
        submittedBy: room.playbackState?.currentSubmittedBy || null,
        source: room.playbackState?.currentSource || VideoSource.USER,
        startedAt: room.playbackState?.startedAt || null,
        paused: room.playbackState?.paused || false,
        currentPosition,
        serverTime: Date.now(),
      },
      queue,
      onlineCount,
      onlineUsers,
      members: room.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        nickname: m.user.nickname,
        role: m.role,
        slotIndex: m.slotIndex,
        isMuted: m.isMuted,
        canSubmit: m.canSubmit,
        isBanned: m.isBanned,
        isOnline: isUserOnlineInRoom(roomId, m.userId),
        lastActiveAt: m.lastActiveAt,
      })),
    });
  }

  // Socket connection handler
  io.on('connection', (socket: Socket) => {
    // 1. Join Room
    socket.on('room:join', async (data: { roomId: string; sessionToken?: string; inviteCode?: string }) => {
      try {
        const { roomId, sessionToken, inviteCode } = data;
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: { settings: true, members: { include: { user: true } } },
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found.' });
          return;
        }

        const clientIp = ((socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()) ||
          (socket.handshake.headers['x-real-ip'] as string)?.trim() ||
          socket.handshake.address ||
          '127.0.0.1';
        const userAgent = (socket.handshake.headers['user-agent'] as string) || undefined;
        let userSession = sessionToken ? await getSession(sessionToken, userAgent, clientIp) : null;
        const userId = userSession ? userSession.userId : `guest-${socket.id.slice(0, 6)}`;
        const userNick = userSession ? userSession.nickname : `Guest ${socket.id.slice(0, 4)}`;

        // Verify access permissions
        const access = await validateRoomAccess(room, userId, inviteCode);
        if (!access.allowed) {
          socket.emit('room:access_denied', { reason: access.reason });
          return;
        }

        // Leave existing rooms
        for (const r of socket.rooms) {
          if (r !== socket.id) socket.leave(r);
        }

        socket.join(`room:${roomId}`);
        socket.join(`user:${userId}`);

        // Register active user
        const memberRecord = room.members.find((m) => m.userId === userId);
        const role = memberRecord?.role || access.role || Role.USER;
        const slotIndex = memberRecord?.slotIndex ?? null;

        const { previousRoomId } = registerSocket(socket.id, {
          userId,
          nickname: userNick,
          roomId,
          role,
          slotIndex,
        });

        activeUsers.set(socket.id, {
          socketId: socket.id,
          userId,
          nickname: userNick,
          roomId,
          role,
          slotIndex,
        });

        if (previousRoomId && previousRoomId !== roomId) {
          await broadcastRoomState(previousRoomId);
          broadcastCounts(previousRoomId);
        }

        // Start room ticker if not running
        if (!roomClockIntervals.has(roomId)) {
          const interval = setInterval(() => tickRoomPlayback(roomId), 1000);
          roomClockIntervals.set(roomId, interval);
        }

        // Send recent chat messages (filter private messages to only show to sender and recipient)
        const recentChat = await prisma.chatMessage.findMany({
          where: {
            roomId,
            deletedAt: null,
            OR: [
              { isPrivate: false },
              { userId },
              { recipientId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        socket.emit('chat:history', recentChat.reverse());

        // Broadcast updated room state and live presence counts
        await broadcastRoomState(roomId);
        broadcastCounts(roomId);
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to join room.' });
      }
    });

    // 2. Claim Seat / Slot
    socket.on('room:claim_slot', async (data: { roomId: string; slotIndex: number; sessionToken: string }) => {
      try {
        const { roomId, slotIndex, sessionToken } = data;
        const session = await getSession(sessionToken);
        if (!session) {
          socket.emit('error', { message: 'Invalid session. Please choose a nickname.' });
          return;
        }

        const member = await claimSlot(roomId, session.userId, slotIndex);

        // Update active user state and presence
        updateSocketSlot(socket.id, member.slotIndex, member.role, member.user.nickname);

        const active = activeUsers.get(socket.id);
        if (active) {
          active.role = member.role;
          active.slotIndex = member.slotIndex;
          active.nickname = member.user.nickname;
        }

        // Post system chat announcement
        await prisma.chatMessage.create({
          data: {
            roomId,
            senderNick: 'System',
            senderRole: Role.USER,
            message: `${member.user.nickname} took seat #${slotIndex}.`,
            isSystem: true,
          },
        });

        await broadcastRoomState(roomId);
        broadcastCounts(roomId);
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to claim seat.' });
      }
    });

    // 2b. Nickname update
    socket.on('user:update_nickname', async (data: { roomId?: string; sessionToken: string; newNickname: string }) => {
      try {
        const { roomId, sessionToken, newNickname } = data;
        const session = await getSession(sessionToken);
        if (!session) {
          socket.emit('error', { message: 'Invalid session.' });
          return;
        }

        const updated = await updateUserNickname(session.userId, newNickname);

        const active = activeUsers.get(socket.id);
        if (active) {
          active.nickname = updated.nickname;
        }

        const affectedRooms = updateUserNicknameInPresence(session.userId, updated.nickname);
        if (roomId && !affectedRooms.includes(roomId)) {
          affectedRooms.push(roomId);
        }

        for (const rId of affectedRooms) {
          await broadcastRoomState(rId);
          broadcastCounts(rId);
        }

        socket.emit('user:nickname_updated', { user: updated });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to update nickname.' });
      }
    });

    // 3. Add Video to Queue
    socket.on('queue:add', async (data: { roomId: string; videoUrl: string; sessionToken: string }) => {
      try {
        const { roomId, videoUrl, sessionToken } = data;
        const session = await getSession(sessionToken);
        if (!session) {
          socket.emit('error', { message: 'Only seated users can add videos to the queue.' });
          return;
        }

        // Check if member is seated in a slot
        const member = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: session.userId } },
        });

        if (!member || member.slotIndex === null) {
          socket.emit('error', { message: 'You must occupy an active seat before adding videos.' });
          return;
        }

        if (!member.canSubmit) {
          socket.emit('error', { message: 'Your video submission permissions have been suspended.' });
          return;
        }

        const meta = await getYouTubeMetadata(videoUrl);
        const item = await addToQueue({
          roomId,
          userId: session.userId,
          userNick: session.nickname,
          video: meta,
          source: member.role === Role.ADMIN ? VideoSource.ADMIN : VideoSource.USER,
        });

        // Broadcast system chat notification
        await prisma.chatMessage.create({
          data: {
            roomId,
            senderNick: 'System',
            senderRole: Role.USER,
            message: `${session.nickname} added a video: "${meta.title}"`,
            isSystem: true,
          },
        });

        // If nothing is playing, trigger playback immediately!
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: { playbackState: true },
        });

        if (!room?.playbackState?.currentVideoId) {
          await popNextVideo(roomId);
        }

        await broadcastRoomState(roomId);
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to add video to queue.' });
      }
    });

    // 4. Remove Video from Queue
    socket.on('queue:remove', async (data: { roomId: string; queueItemId: string; sessionToken: string }) => {
      try {
        const { roomId, queueItemId, sessionToken } = data;
        const session = await getSession(sessionToken);
        if (!session) return;

        const member = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: session.userId } },
        });

        const isMod = member && (member.role === Role.MODERATOR || member.role === Role.ADMIN);
        await removeQueueItem(roomId, queueItemId, session.userId, !!isMod);

        await broadcastRoomState(roomId);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // 5. Reorder Queue Item (Mod/Admin)
    socket.on('queue:reorder', async (data: { roomId: string; queueItemId: string; targetPosition: number; sessionToken: string }) => {
      try {
        const { roomId, queueItemId, targetPosition, sessionToken } = data;
        const session = await getSession(sessionToken);
        if (!session) return;

        const member = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: session.userId } },
        });

        if (!member || (member.role !== Role.MODERATOR && member.role !== Role.ADMIN)) {
          socket.emit('error', { message: 'Only moderators can reorder the queue.' });
          return;
        }

        await reorderQueueItem(roomId, queueItemId, targetPosition);
        await broadcastRoomState(roomId);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // 6. Cast Vote on Queue Item
    socket.on('queue:vote', async (data: { roomId: string; queueItemId: string; value: 1 | -1; sessionToken: string }) => {
      try {
        const { roomId, queueItemId, value, sessionToken } = data;
        const session = await getSession(sessionToken);
        if (!session) {
          socket.emit('error', { message: 'Please claim a seat to vote on videos.' });
          return;
        }

        await castVote({
          roomId,
          queueItemId,
          userId: session.userId,
          value,
        });

        await broadcastRoomState(roomId);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // 7. Live Chat Send Message (Public or Private Whisper)
    socket.on('chat:send', async (data: { roomId: string; message: string; sessionToken: string; recipientUserId?: string }) => {
      try {
        const { roomId, message, sessionToken, recipientUserId } = data;
        const session = await getSession(sessionToken);
        if (!session) {
          socket.emit('error', { message: 'You must occupy a seat to chat.' });
          return;
        }

        // Rate limit check (3 msgs / 3 sec)
        if (!checkChatRateLimit(session.userId)) {
          socket.emit('error', { message: 'You are sending messages too fast. Please wait!' });
          return;
        }

        // Check mute status
        const member = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: session.userId } },
        });

        if (member?.isMuted) {
          socket.emit('error', { message: 'You are muted and cannot chat.' });
          return;
        }

        // Check recipient if private message
        let recipientMember = null;
        if (recipientUserId) {
          recipientMember = await prisma.roomMember.findUnique({
            where: { roomId_userId: { roomId, userId: recipientUserId } },
            include: { user: true },
          });

          if (!recipientMember) {
            socket.emit('error', { message: 'A címzett nem található a szobában.' });
            return;
          }

          const isSenderAdminOrMod = session.isGlobalAdmin || (member && (member.role === Role.ADMIN || member.role === Role.MODERATOR));
          const isRecipientAdminOrMod = recipientMember.user.isGlobalAdmin || recipientMember.role === Role.ADMIN || recipientMember.role === Role.MODERATOR;

          if (!isSenderAdminOrMod && !isRecipientAdminOrMod) {
            socket.emit('error', { message: 'Privát üzenet csak adminisztrátor vagy moderátor bevonásával küldhető.' });
            return;
          }
        }

        const sanitized = sanitizeText(message).slice(0, 500);
        if (!sanitized) return;

        const chatMsg = await prisma.chatMessage.create({
          data: {
            roomId,
            userId: session.userId,
            senderNick: session.nickname,
            senderRole: member?.role || Role.USER,
            message: sanitized,
            isSystem: false,
            isPrivate: !!recipientUserId,
            recipientId: recipientUserId || null,
            recipientNick: recipientMember ? recipientMember.user.nickname : null,
          },
        });

        if (recipientUserId) {
          // Send private message only to sender and recipient user rooms
          io.to(`user:${session.userId}`).to(`user:${recipientUserId}`).emit('chat:message', chatMsg);
        } else {
          io.to(`room:${roomId}`).emit('chat:message', chatMsg);
        }
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // 8. Delete Chat Message (Mod/Admin)
    socket.on('chat:delete', async (data: { roomId: string; messageId: string; sessionToken: string }) => {
      try {
        const { roomId, messageId, sessionToken } = data;
        const session = await getSession(sessionToken);
        if (!session) return;

        const member = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: session.userId } },
        });

        if (!member || (member.role !== Role.MODERATOR && member.role !== Role.ADMIN)) {
          socket.emit('error', { message: 'Permission denied.' });
          return;
        }

        await prisma.chatMessage.update({
          where: { id: messageId },
          data: { deletedAt: new Date() },
        });

        io.to(`room:${roomId}`).emit('chat:deleted', { messageId });
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // 9. Floating Emoji Reaction
    socket.on('reaction:send', (data: { roomId: string; emoji: string; sessionToken?: string }) => {
      try {
        const { roomId, emoji, sessionToken } = data;
        const active = activeUsers.get(socket.id);
        const userId = active?.userId || socket.id;

        // Rate limit: max 5 reactions / 10s per user
        if (!checkEmojiRateLimit(userId)) {
          return;
        }

        const allowedEmojis = ['❤️', '🔥', '😂', '👏', '😍', '😮', '👎'];
        if (!allowedEmojis.includes(emoji)) return;

        io.to(`room:${roomId}`).emit('reaction:broadcast', {
          emoji,
          userNick: active?.nickname || 'Guest',
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Reaction error:', err);
      }
    });

    // 10. Skip Current Video (Mod/Admin)
    socket.on('mod:skip', async (data: { roomId: string; sessionToken: string }) => {
      try {
        const { roomId, sessionToken } = data;
        const session = await getSession(sessionToken);
        if (!session) return;

        const member = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: session.userId } },
        });

        if (!member || (member.role !== Role.MODERATOR && member.role !== Role.ADMIN)) {
          socket.emit('error', { message: 'Only moderators can skip videos.' });
          return;
        }

        await popNextVideo(roomId);
        await checkAndRefillDJ(roomId);

        // System message
        await prisma.chatMessage.create({
          data: {
            roomId,
            senderNick: 'System',
            senderRole: Role.USER,
            message: `${session.nickname} skipped the current video.`,
            isSystem: true,
          },
        });

        await broadcastRoomState(roomId);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // 11. Change Member Role (Admin only)
    socket.on('mod:set_role', async (data: { roomId: string; targetUserId: string; newRole: Role; sessionToken: string }) => {
      try {
        const { roomId, targetUserId, newRole, sessionToken } = data;
        const session = await getSession(sessionToken);
        if (!session) return;

        const requester = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: session.userId } },
        });

        const isAuthorized = session.isGlobalAdmin || (requester && requester.role === Role.ADMIN);
        if (!isAuthorized) {
          socket.emit('error', { message: 'Csak szoba admin vagy globális admin módosíthat rangot.' });
          return;
        }

        const targetMember = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: targetUserId } },
          include: { user: true },
        });
        if (!targetMember) {
          socket.emit('error', { message: 'A felhasználó nem található a szobában.' });
          return;
        }

        await prisma.roomMember.update({
          where: { id: targetMember.id },
          data: { role: newRole },
        });

        // Audit log
        await prisma.auditLog.create({
          data: {
            roomId,
            userId: session.userId,
            userNick: session.nickname,
            action: 'CHANGE_MEMBER_ROLE',
            details: JSON.stringify({ targetNick: targetMember.user.nickname, targetUserId, newRole }),
          },
        });

        // System message
        const roleLabel = newRole === Role.ADMIN ? 'Szoba Admin' : newRole === Role.MODERATOR ? 'Moderátor' : 'Felhasználó';
        await prisma.chatMessage.create({
          data: {
            roomId,
            senderNick: 'System',
            senderRole: Role.ADMIN,
            message: `${session.nickname} beállította ${targetMember.user.nickname} rangját: ${roleLabel}.`,
            isSystem: true,
          },
        });

        await broadcastRoomState(roomId);
        broadcastCounts(roomId);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // 12. Kick user from slot (Mod/Admin)
    socket.on('mod:kick', async (data: { roomId: string; targetUserId: string; sessionToken: string }) => {
      try {
        const { roomId, targetUserId, sessionToken } = data;
        const session = await getSession(sessionToken);
        if (!session) return;

        const requester = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: session.userId } },
        });

        const isAuthorized = session.isGlobalAdmin || (requester && (requester.role === Role.ADMIN || requester.role === Role.MODERATOR));
        if (!isAuthorized) {
          socket.emit('error', { message: 'Nincs jogosultságod felhasználó kidobásához.' });
          return;
        }

        const targetMember = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: targetUserId } },
          include: { user: true },
        });
        if (!targetMember) return;

        await prisma.roomMember.update({
          where: { id: targetMember.id },
          data: { slotIndex: null },
        });

        // Update presence and memory state
        updateUserSlotInRoom(roomId, targetUserId, null);
        for (const [sId, u] of activeUsers.entries()) {
          if (u.roomId === roomId && u.userId === targetUserId) {
            u.slotIndex = null;
          }
        }

        await prisma.chatMessage.create({
          data: {
            roomId,
            senderNick: 'System',
            senderRole: Role.MODERATOR,
            message: `${session.nickname} felállította ${targetMember.user.nickname} felhasználót a helyéről.`,
            isSystem: true,
          },
        });

        await broadcastRoomState(roomId);
        broadcastCounts(roomId);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // 13. Mute / Unmute user (Mod/Admin)
    socket.on('mod:mute', async (data: { roomId: string; targetUserId: string; isMuted: boolean; sessionToken: string }) => {
      try {
        const { roomId, targetUserId, isMuted, sessionToken } = data;
        const session = await getSession(sessionToken);
        if (!session) return;

        const requester = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: session.userId } },
        });

        const isAuthorized = session.isGlobalAdmin || (requester && (requester.role === Role.ADMIN || requester.role === Role.MODERATOR));
        if (!isAuthorized) {
          socket.emit('error', { message: 'Nincs jogosultságod a némítás módosításához.' });
          return;
        }

        const targetMember = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: targetUserId } },
          include: { user: true },
        });
        if (!targetMember) return;

        await prisma.roomMember.update({
          where: { id: targetMember.id },
          data: { isMuted },
        });

        await prisma.chatMessage.create({
          data: {
            roomId,
            senderNick: 'System',
            senderRole: Role.MODERATOR,
            message: `${session.nickname} ${isMuted ? 'némította' : 'feloldotta a némítását'} ${targetMember.user.nickname} felhasználónak.`,
            isSystem: true,
          },
        });

        await broadcastRoomState(roomId);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // Leave Room
    socket.on('room:leave', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        socket.leave(`room:${roomId}`);
        activeUsers.delete(socket.id);
        unregisterSocket(socket.id);
        await broadcastRoomState(roomId);
        broadcastCounts(roomId);
      } catch (err) {
        console.error('Error leaving room:', err);
      }
    });

    // 14. Disconnect (instant state update and count broadcast)
    socket.on('disconnect', async () => {
      const active = activeUsers.get(socket.id);
      if (active) {
        activeUsers.delete(socket.id);
      }
      const unregistered = unregisterSocket(socket.id);
      const roomId = active?.roomId || unregistered?.roomId;
      if (roomId) {
        await broadcastRoomState(roomId);
        broadcastCounts(roomId);
      }
    });
  });

  return io;
}
