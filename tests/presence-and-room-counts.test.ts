import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerSocket,
  unregisterSocket,
  updateSocketSlot,
  updateUserNicknameInPresence,
  getRoomOnlineCount,
  getRoomParticipants,
  getAllRoomCounts,
  isUserOnlineInRoom,
  clearPresence,
} from '../src/lib/presence';
import { Role } from '@prisma/client';

describe('Presence & Real-Time Room Counts System', () => {
  beforeEach(() => {
    clearPresence();
  });

  it('accurately counts users when joining a room, including spectators', () => {
    expect(getRoomOnlineCount('room-1')).toBe(0);

    // Spectator 1 joins
    registerSocket('sock-1', {
      userId: 'user-1',
      nickname: 'SpectatorBob',
      roomId: 'room-1',
      role: Role.USER,
      slotIndex: null,
    });

    expect(getRoomOnlineCount('room-1')).toBe(1);

    // DJ 1 joins
    registerSocket('sock-2', {
      userId: 'user-2',
      nickname: 'DJAlice',
      roomId: 'room-1',
      role: Role.USER,
      slotIndex: 1,
    });

    expect(getRoomOnlineCount('room-1')).toBe(2);

    // Check participants list
    const participants = getRoomParticipants('room-1');
    expect(participants.length).toBe(2);
    // DJ with slot 1 comes first
    expect(participants[0].userId).toBe('user-2');
    expect(participants[0].slotIndex).toBe(1);
    expect(participants[1].userId).toBe('user-1');
    expect(participants[1].slotIndex).toBeNull();
  });

  it('deduplicates counts if same user opens multiple tabs', () => {
    registerSocket('sock-tab-1', {
      userId: 'user-multi',
      nickname: 'MultiTabUser',
      roomId: 'room-1',
      role: Role.USER,
      slotIndex: null,
    });

    registerSocket('sock-tab-2', {
      userId: 'user-multi',
      nickname: 'MultiTabUser',
      roomId: 'room-1',
      role: Role.USER,
      slotIndex: null,
    });

    // Count must be 1 unique user!
    expect(getRoomOnlineCount('room-1')).toBe(1);

    // Tab 2 claims a slot
    updateSocketSlot('sock-tab-2', 3);

    const participants = getRoomParticipants('room-1');
    expect(participants.length).toBe(1);
    expect(participants[0].slotIndex).toBe(3);

    // One tab closes
    unregisterSocket('sock-tab-1');
    // User is still online via tab 2!
    expect(getRoomOnlineCount('room-1')).toBe(1);
    expect(isUserOnlineInRoom('room-1', 'user-multi')).toBe(true);

    // Tab 2 closes
    unregisterSocket('sock-tab-2');
    expect(getRoomOnlineCount('room-1')).toBe(0);
    expect(isUserOnlineInRoom('room-1', 'user-multi')).toBe(false);
  });

  it('instantly decrements count when user disconnects', () => {
    registerSocket('sock-a', {
      userId: 'user-a',
      nickname: 'UserA',
      roomId: 'room-2',
      role: Role.USER,
    });

    registerSocket('sock-b', {
      userId: 'user-b',
      nickname: 'UserB',
      roomId: 'room-2',
      role: Role.USER,
    });

    expect(getRoomOnlineCount('room-2')).toBe(2);

    const unregistered = unregisterSocket('sock-a');
    expect(unregistered?.roomId).toBe('room-2');
    expect(getRoomOnlineCount('room-2')).toBe(1);

    unregisterSocket('sock-b');
    expect(getRoomOnlineCount('room-2')).toBe(0);
  });

  it('handles room switching seamlessly', () => {
    // User starts in room A
    const res1 = registerSocket('sock-100', {
      userId: 'user-switcher',
      nickname: 'Switcher',
      roomId: 'room-A',
    });
    expect(res1.previousRoomId).toBeNull();
    expect(getRoomOnlineCount('room-A')).toBe(1);
    expect(getRoomOnlineCount('room-B')).toBe(0);

    // User switches to room B with the same socket
    const res2 = registerSocket('sock-100', {
      userId: 'user-switcher',
      nickname: 'Switcher',
      roomId: 'room-B',
    });
    expect(res2.previousRoomId).toBe('room-A');
    expect(getRoomOnlineCount('room-A')).toBe(0);
    expect(getRoomOnlineCount('room-B')).toBe(1);
  });

  it('returns all room counts in a single snapshot', () => {
    registerSocket('s1', { userId: 'u1', nickname: 'U1', roomId: 'chill' });
    registerSocket('s2', { userId: 'u2', nickname: 'U2', roomId: 'chill' });
    registerSocket('s3', { userId: 'u3', nickname: 'U3', roomId: 'rock' });

    const counts = getAllRoomCounts();
    expect(counts['chill']).toBe(2);
    expect(counts['rock']).toBe(1);
  });

  it('updates user nicknames across rooms in presence', () => {
    registerSocket('s1', { userId: 'u-nick', nickname: 'OldNick', roomId: 'room-z' });

    const affected = updateUserNicknameInPresence('u-nick', 'NewNick');
    expect(affected).toContain('room-z');

    const participants = getRoomParticipants('room-z');
    expect(participants[0].nickname).toBe('NewNick');
  });
});
