import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createRoom } from '@/lib/room';
import { getSession } from '@/lib/session';
import { getRoomOnlineCount } from '@/lib/presence';
import { RoomType } from '@prisma/client';

export async function GET() {
  try {
    const publicRooms = await prisma.room.findMany({
      where: { type: RoomType.PUBLIC },
      include: {
        settings: true,
        playbackState: {
          select: {
            currentVideoId: true,
            currentTitle: true,
            currentThumbnail: true,
          },
        },
        members: {
          select: {
            id: true,
            userId: true,
            slotIndex: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = publicRooms.map((r) => {
      const liveCount = getRoomOnlineCount(r.id);
      const dbActiveCount = new Set(
        r.members
          .filter((m) => Date.now() - new Date(m.lastActiveAt).getTime() < 2 * 60 * 1000)
          .map((m) => m.userId)
      ).size;
      const activeMembersCount = liveCount > 0 ? liveCount : dbActiveCount;

      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        type: r.type,
        isLocked: r.isLocked,
        slotCount: r.settings?.slotCount || 10,
        activeCount: activeMembersCount,
        nowPlaying: r.playbackState?.currentTitle || null,
        thumbnail: r.playbackState?.currentThumbnail || null,
      };
    });

    return NextResponse.json({ rooms: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('allyoutuber_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Session required to create a room.' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, type = 'PUBLIC', slotCount = 10 } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Room name must be at least 2 characters.' }, { status: 400 });
    }

    const roomType = type === 'PRIVATE' ? RoomType.PRIVATE : RoomType.PUBLIC;
    const { room, inviteCode } = await createRoom({
      name,
      slug,
      type: roomType,
      slotCount: Number(slotCount),
      userId: session.userId,
    });

    return NextResponse.json({ room, inviteCode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
