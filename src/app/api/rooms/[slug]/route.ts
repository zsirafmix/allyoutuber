import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateRoomAccess } from '@/lib/room';
import { getSession } from '@/lib/session';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const inviteParam = req.nextUrl.searchParams.get('invite') || undefined;

    const room = await prisma.room.findUnique({
      where: { slug },
      include: {
        settings: true,
        playbackState: true,
        members: {
          include: { user: true },
          orderBy: { slotIndex: 'asc' },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    const token = req.cookies.get('allyoutuber_token')?.value;
    const session = token ? await getSession(token) : null;
    const userId = session ? session.userId : 'guest';

    const access = await validateRoomAccess(room, userId, inviteParam);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Access denied.' }, { status: 403 });
    }

    return NextResponse.json({
      room: {
        id: room.id,
        slug: room.slug,
        name: room.name,
        type: room.type,
        isLocked: room.isLocked,
        settings: room.settings,
        playbackState: room.playbackState,
        members: room.members,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const token = req.cookies.get('allyoutuber_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const session = token ? await getSession(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Bejelentkezés szükséges.' }, { status: 401 });
    }

    const room = await prisma.room.findUnique({
      where: { slug },
      include: { members: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'A szoba nem található.' }, { status: 404 });
    }

    const member = room.members.find((m) => m.userId === session.userId);
    const isAuthorized = session.isGlobalAdmin || (member && member.role === 'ADMIN');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Nincs jogosultságod a szoba törléséhez.' }, { status: 403 });
    }

    // Delete room (cascade will handle child models)
    await prisma.room.delete({
      where: { id: room.id },
    });

    // Record in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userNick: session.nickname,
        action: 'DELETE_ROOM',
        details: JSON.stringify({ roomId: room.id, roomName: room.name, slug: room.slug }),
      },
    });

    return NextResponse.json({ success: true, message: 'Szoba sikeresen törölve.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

