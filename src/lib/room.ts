import prisma from './prisma';
import { RoomType, Role, DJMode, QueueMode } from '@prisma/client';
import { generateInviteCode, hashInviteCode } from './session';
import { getDJStyle } from './djStyles';

export interface CreateRoomInput {
  name: string;
  slug?: string;
  type: RoomType;
  slotCount?: number;
  userId: string;
  djStyle?: string;
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base || 'room'}-${suffix}`;
}

export async function createRoom(input: CreateRoomInput) {
  const slug = input.slug ? input.slug.toLowerCase().trim() : generateSlug(input.name);
  const chosenStyle = getDJStyle(input.djStyle);

  // Check unique slug
  const existing = await prisma.room.findUnique({ where: { slug } });
  if (existing) {
    throw new Error('A room with this URL or slug already exists.');
  }

  const room = await prisma.room.create({
    data: {
      name: input.name.trim(),
      slug,
      type: input.type,
      createdById: input.userId,
      settings: {
        create: {
          slotCount: input.slotCount && input.slotCount > 0 ? input.slotCount : 10,
          maxConsecutiveVideosPerUser: 2,
          maxQueuedVideosPerUser: 5,
          maxVideoDurationMinutes: 15,
          allowShorts: true,
          allowLive: false,
          allowDuplicateVideos: false,
          queueMode: QueueMode.FIFO,
          chatEnabled: true,
          reactionsEnabled: true,
          votingEnabled: true,
          djMode: DJMode.AUTO,
          djMinimumQueueLength: 2,
          djRepeatProtectionCount: 20,
          djStyle: chosenStyle.id,
          djPlaylist: JSON.stringify(chosenStyle.tracks),
        },
      },
      playbackState: {
        create: {
          paused: false,
          currentPosition: 0,
        },
      },
    },
    include: {
      settings: true,
      playbackState: true,
    },
  });

  // Assign creator as Room ADMIN in slot 1
  await prisma.roomMember.create({
    data: {
      roomId: room.id,
      userId: input.userId,
      role: Role.ADMIN,
      slotIndex: 1,
    },
  });

  // If PRIVATE room, generate invite code
  let inviteCode: string | null = null;
  if (input.type === RoomType.PRIVATE) {
    inviteCode = generateInviteCode();
    await prisma.roomInvite.create({
      data: {
        roomId: room.id,
        codeHash: hashInviteCode(inviteCode),
        codePrefix: inviteCode.slice(0, 4),
        createdById: input.userId,
      },
    });
  }

  return { room, inviteCode };
}

export async function regenerateRoomInvite(roomId: string, userId: string): Promise<string> {
  // Check that user is room ADMIN
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member || member.role !== Role.ADMIN) {
    throw new Error('Only room admins can regenerate invite codes.');
  }

  // Deactivate all old invites
  await prisma.roomInvite.updateMany({
    where: { roomId, isActive: true },
    data: { isActive: false },
  });

  const newCode = generateInviteCode();
  await prisma.roomInvite.create({
    data: {
      roomId,
      codeHash: hashInviteCode(newCode),
      codePrefix: newCode.slice(0, 4),
      createdById: userId,
    },
  });

  // Log in AuditLog
  await prisma.auditLog.create({
    data: {
      roomId,
      userId,
      action: 'REGENERATE_INVITE_CODE',
      details: JSON.stringify({ prefix: newCode.slice(0, 4) + '-****' }),
    },
  });

  return newCode;
}

export async function validateRoomAccess(
  room: { id: string; type: RoomType; isLocked: boolean },
  userId: string,
  inviteCode?: string
): Promise<{ allowed: boolean; role?: Role; reason?: string }> {
  // 1. Check if user is banned
  const banned = await prisma.ban.findFirst({
    where: {
      userId,
      OR: [{ roomId: room.id }, { roomId: null }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
    },
  });

  if (banned) {
    return { allowed: false, reason: banned.reason || 'You are banned from this room.' };
  }

  // 2. Check if already a member
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId } },
  });

  if (member) {
    if (member.isBanned) return { allowed: false, reason: 'You are banned from this room.' };
    return { allowed: true, role: member.role };
  }

  // 3. If room is locked and user is not admin
  if (room.isLocked) {
    return { allowed: false, reason: 'This room is currently locked by the administrator.' };
  }

  // 4. If PUBLIC room, open to all
  if (room.type === RoomType.PUBLIC) {
    return { allowed: true, role: Role.USER };
  }

  // 5. If PRIVATE room, inviteCode is required
  if (!inviteCode) {
    return { allowed: false, reason: 'An invitation code is required to join this private room.' };
  }

  const codeHash = hashInviteCode(inviteCode);
  const invite = await prisma.roomInvite.findFirst({
    where: {
      roomId: room.id,
      codeHash,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!invite) {
    return { allowed: false, reason: 'Invalid or expired invitation code.' };
  }

  return { allowed: true, role: Role.USER };
}

/**
 * Occupies a slot for a user in a room.
 */
export async function claimSlot(roomId: string, userId: string, targetSlot: number) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { settings: true },
  });
  if (!room) throw new Error('Room not found.');

  const maxSlots = room.settings?.slotCount || 10;
  if (targetSlot < 1 || targetSlot > maxSlots) {
    throw new Error(`Slot number must be between 1 and ${maxSlots}.`);
  }

  // Check if slot is already occupied by someone active
  const graceThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minute grace period
  const existingSlotMember = await prisma.roomMember.findFirst({
    where: {
      roomId,
      slotIndex: targetSlot,
    },
    include: { user: true },
  });

  if (existingSlotMember) {
    if (existingSlotMember.userId === userId) {
      // Already this user's slot
      return existingSlotMember;
    }
    if (existingSlotMember.lastActiveAt > graceThreshold) {
      throw new Error(`Slot ${targetSlot} is currently occupied by ${existingSlotMember.user.nickname}.`);
    } else {
      // Reclaim expired slot
      await prisma.roomMember.update({
        where: { id: existingSlotMember.id },
        data: { slotIndex: null },
      });
    }
  }

  // Assign user to this slot
  const member = await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId, userId } },
    update: {
      slotIndex: targetSlot,
      lastActiveAt: new Date(),
    },
    create: {
      roomId,
      userId,
      role: Role.USER,
      slotIndex: targetSlot,
      lastActiveAt: new Date(),
    },
    include: { user: true },
  });

  return member;
}
