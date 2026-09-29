import { Role } from '@prisma/client';

export interface ActiveSocketSession {
  socketId: string;
  userId: string;
  nickname: string;
  roomId: string;
  role: Role;
  slotIndex: number | null;
  joinedAt: number;
  lastActiveAt: number;
}

export interface RoomParticipant {
  userId: string;
  nickname: string;
  role: Role;
  slotIndex: number | null;
  isOnline: boolean;
  joinedAt: number;
}

class PresenceManager {
  private sockets = new Map<string, ActiveSocketSession>(); // socketId -> ActiveSocketSession
  private roomSockets = new Map<string, Set<string>>(); // roomId -> Set<socketId>

  /**
   * Registers a socket in a room. If this socket was already in another room,
   * it unregisters from the previous room first.
   */
  public registerSocket(
    socketId: string,
    data: {
      userId: string;
      nickname: string;
      roomId: string;
      role?: Role;
      slotIndex?: number | null;
    }
  ): { previousRoomId: string | null } {
    const existing = this.sockets.get(socketId);
    let previousRoomId: string | null = null;

    if (existing && existing.roomId !== data.roomId) {
      previousRoomId = existing.roomId;
      this.unregisterSocket(socketId);
    }

    const session: ActiveSocketSession = {
      socketId,
      userId: data.userId,
      nickname: data.nickname,
      roomId: data.roomId,
      role: data.role || Role.USER,
      slotIndex: data.slotIndex !== undefined ? data.slotIndex : null,
      joinedAt: existing ? existing.joinedAt : Date.now(),
      lastActiveAt: Date.now(),
    };

    this.sockets.set(socketId, session);

    let roomSet = this.roomSockets.get(data.roomId);
    if (!roomSet) {
      roomSet = new Set<string>();
      this.roomSockets.set(data.roomId, roomSet);
    }
    roomSet.add(socketId);

    return { previousRoomId };
  }

  /**
   * Unregisters a socket (e.g. on disconnect or explicit leave).
   */
  public unregisterSocket(socketId: string): ActiveSocketSession | null {
    const session = this.sockets.get(socketId);
    if (!session) return null;

    this.sockets.delete(socketId);

    const roomSet = this.roomSockets.get(session.roomId);
    if (roomSet) {
      roomSet.delete(socketId);
      if (roomSet.size === 0) {
        this.roomSockets.delete(session.roomId);
      }
    }

    return session;
  }

  /**
   * Updates slot index, role, or nickname for a socket.
   */
  public updateSocketSlot(
    socketId: string,
    slotIndex: number | null,
    role?: Role,
    nickname?: string
  ): ActiveSocketSession | null {
    const session = this.sockets.get(socketId);
    if (!session) return null;

    session.slotIndex = slotIndex;
    if (role !== undefined) session.role = role;
    if (nickname !== undefined) session.nickname = nickname;
    session.lastActiveAt = Date.now();

    return session;
  }

  /**
   * Updates nickname across all active sockets for a specific user ID.
   */
  public updateUserNickname(userId: string, newNickname: string): string[] {
    const affectedRoomIds = new Set<string>();

    for (const session of this.sockets.values()) {
      if (session.userId === userId) {
        session.nickname = newNickname;
        session.lastActiveAt = Date.now();
        affectedRoomIds.add(session.roomId);
      }
    }

    return Array.from(affectedRoomIds);
  }

  /**
   * Updates slot index for all active sockets of a user in a specific room.
   */
  public updateUserSlotInRoom(roomId: string, userId: string, slotIndex: number | null): void {
    const roomSet = this.roomSockets.get(roomId);
    if (!roomSet) return;

    for (const socketId of roomSet) {
      const session = this.sockets.get(socketId);
      if (session && session.userId === userId) {
        session.slotIndex = slotIndex;
        session.lastActiveAt = Date.now();
      }
    }
  }

  /**
   * Updates role for all active sockets of a user in a specific room.
   */
  public updateUserRoleInRoom(roomId: string, userId: string, role: Role): void {
    const roomSet = this.roomSockets.get(roomId);
    if (!roomSet) return;

    for (const socketId of roomSet) {
      const session = this.sockets.get(socketId);
      if (session && session.userId === userId) {
        session.role = role;
        session.lastActiveAt = Date.now();
      }
    }
  }

  /**
   * Returns the count of distinct unique users (by userId) currently connected to the room.
   */
  public getRoomOnlineCount(roomId: string): number {
    const roomSet = this.roomSockets.get(roomId);
    if (!roomSet || roomSet.size === 0) return 0;

    const uniqueUsers = new Set<string>();
    for (const socketId of roomSet) {
      const session = this.sockets.get(socketId);
      if (session) {
        uniqueUsers.add(session.userId);
      }
    }

    return uniqueUsers.size;
  }

  /**
   * Returns the list of unique participants currently in the room (DJs and audience).
   */
  public getRoomParticipants(roomId: string): RoomParticipant[] {
    const roomSet = this.roomSockets.get(roomId);
    if (!roomSet || roomSet.size === 0) return [];

    const userMap = new Map<string, RoomParticipant>();

    for (const socketId of roomSet) {
      const session = this.sockets.get(socketId);
      if (!session) continue;

      const existing = userMap.get(session.userId);
      if (!existing) {
        userMap.set(session.userId, {
          userId: session.userId,
          nickname: session.nickname,
          role: session.role,
          slotIndex: session.slotIndex,
          isOnline: true,
          joinedAt: session.joinedAt,
        });
      } else {
        // If one of the sessions has a claimed slot, preserve it
        if (existing.slotIndex === null && session.slotIndex !== null) {
          existing.slotIndex = session.slotIndex;
        }
        // Promote highest role if multiple sockets
        if (session.role === Role.ADMIN || (session.role === Role.MODERATOR && existing.role !== Role.ADMIN)) {
          existing.role = session.role;
        }
      }
    }

    return Array.from(userMap.values()).sort((a, b) => {
      // DJs first, ordered by slotIndex
      if (a.slotIndex !== null && b.slotIndex !== null) return a.slotIndex - b.slotIndex;
      if (a.slotIndex !== null) return -1;
      if (b.slotIndex !== null) return 1;
      // Then audience alphabetically
      return a.nickname.localeCompare(b.nickname);
    });
  }

  /**
   * Returns a map of roomId -> onlineCount for all rooms with active sockets.
   */
  public getAllRoomCounts(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [roomId] of this.roomSockets) {
      result[roomId] = this.getRoomOnlineCount(roomId);
    }
    return result;
  }

  /**
   * Checks if a user is currently online in a room.
   */
  public isUserOnlineInRoom(roomId: string, userId: string): boolean {
    const roomSet = this.roomSockets.get(roomId);
    if (!roomSet) return false;

    for (const socketId of roomSet) {
      const session = this.sockets.get(socketId);
      if (session && session.userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clears all state (primarily for unit tests).
   */
  public clear(): void {
    this.sockets.clear();
    this.roomSockets.clear();
  }
}

// Preserve singleton across fast refresh / module reloads in Node.js
const globalForPresence = globalThis as unknown as { presenceManager?: PresenceManager };

export const presence = globalForPresence.presenceManager || new PresenceManager();

if (process.env.NODE_ENV !== 'production') {
  globalForPresence.presenceManager = presence;
}

export const registerSocket = presence.registerSocket.bind(presence);
export const unregisterSocket = presence.unregisterSocket.bind(presence);
export const updateSocketSlot = presence.updateSocketSlot.bind(presence);
export const updateUserSlotInRoom = presence.updateUserSlotInRoom.bind(presence);
export const updateUserRoleInRoom = presence.updateUserRoleInRoom.bind(presence);
export const updateUserNicknameInPresence = presence.updateUserNickname.bind(presence);
export const getRoomOnlineCount = presence.getRoomOnlineCount.bind(presence);
export const getRoomParticipants = presence.getRoomParticipants.bind(presence);
export const getAllRoomCounts = presence.getAllRoomCounts.bind(presence);
export const isUserOnlineInRoom = presence.isUserOnlineInRoom.bind(presence);
export const clearPresence = presence.clear.bind(presence);
