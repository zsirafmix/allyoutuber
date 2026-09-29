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

    const [rooms, usersCount, recentLogs] = await Promise.all([
      prisma.room.findMany({
        include: {
          settings: true,
          playbackState: true,
          members: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
      prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      rooms,
      usersCount,
      recentLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
