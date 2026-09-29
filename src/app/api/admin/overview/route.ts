import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('allyoutuber_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const session = token ? await getSession(token) : null;

    if (!session || !session.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden. Global admin access required.' }, { status: 403 });
    }

    const [rooms, usersCount, users, recentLogs] = await Promise.all([
      prisma.room.findMany({
        include: {
          settings: true,
          playbackState: true,
          members: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
      prisma.user.findMany({
        select: {
          id: true,
          nickname: true,
          isGlobalAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      rooms,
      usersCount,
      users,
      recentLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
