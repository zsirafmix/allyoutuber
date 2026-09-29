import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { lookupGeoIp, getClientIp } from '@/lib/geoIp';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('allyoutuber_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const session = token ? await getSession(token) : null;

    if (!session || !session.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden. Global admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetIp = searchParams.get('ip') || getClientIp(req);

    const geo = await lookupGeoIp(targetIp);

    // Find users who have ever connected from this IP
    const matchingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { sessions: { some: { ipAddress: targetIp } } },
          { auditLogs: { some: { ipAddress: targetIp } } },
        ],
      },
      select: {
        id: true,
        nickname: true,
        isGlobalAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 20,
    });

    return NextResponse.json({
      geo,
      matchingUsers,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
