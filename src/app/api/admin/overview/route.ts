import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { lookupGeoIp, parseUserAgent } from '@/lib/geoIp';
import { getRoomOnlineCount } from '@/lib/presence';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('allyoutuber_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const session = token ? await getSession(token) : null;

    if (!session || !session.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden. Global admin access required.' }, { status: 403 });
    }

    const [rooms, usersCount, rawUsers, recentLogs] = await Promise.all([
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
          sessions: {
            select: {
              ipAddress: true,
              userAgent: true,
              lastSeenAt: true,
              createdAt: true,
            },
            orderBy: { lastSeenAt: 'desc' },
            take: 5,
          },
          auditLogs: {
            select: {
              ipAddress: true,
              action: true,
              createdAt: true,
            },
            where: {
              ipAddress: { not: null },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Enrich users with detailed IP geolocation and device metadata
    const users = await Promise.all(
      rawUsers.map(async (u) => {
        const sessionIps = u.sessions.map((s) => s.ipAddress).filter((ip): ip is string => Boolean(ip));
        const auditIps = u.auditLogs.map((a) => a.ipAddress).filter((ip): ip is string => Boolean(ip));
        const allIps = Array.from(new Set([...sessionIps, ...auditIps]));

        const latestSession = u.sessions[0];
        const latestIp = latestSession?.ipAddress || allIps[0] || null;
        const latestUserAgent = latestSession?.userAgent || null;

        let geo = null;
        if (latestIp) {
          geo = await lookupGeoIp(latestIp);
        }

        const device = parseUserAgent(latestUserAgent);
        const lastActive = latestSession?.lastSeenAt || u.updatedAt;
        const isOnline = Date.now() - new Date(lastActive).getTime() < 5 * 60 * 1000;

        return {
          id: u.id,
          nickname: u.nickname,
          isGlobalAdmin: u.isGlobalAdmin,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          lastSeenAt: lastActive,
          isOnline,
          latestIp,
          allIps,
          geo,
          device,
          sessionsCount: u.sessions.length,
        };
      })
    );

    // Enrich recent logs with basic geo info for IP
    const logs = await Promise.all(
      recentLogs.map(async (log) => {
        let geo = null;
        if (log.ipAddress) {
          geo = await lookupGeoIp(log.ipAddress);
        }
        return {
          ...log,
          geo,
        };
      })
    );

    const enrichedRooms = rooms.map((r) => ({
      ...r,
      onlineCount: getRoomOnlineCount(r.id),
    }));

    return NextResponse.json({
      rooms: enrichedRooms,
      usersCount,
      users,
      recentLogs: logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
