import { NextRequest, NextResponse } from 'next/server';
import { createTvSession, getTvSessionByToken } from '@/lib/tv';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const existingToken = body.token || req.headers.get('x-tv-token');

    // If existing valid paired token provided, return current status
    if (existingToken) {
      const existing = await getTvSessionByToken(existingToken);
      if (existing && existing.status === 'PAIRED' && existing.room) {
        return NextResponse.json({
          session: {
            id: existing.id,
            token: existing.token,
            deviceName: existing.deviceName,
            status: existing.status,
            roomId: existing.roomId,
            roomSlug: existing.room.slug,
            roomName: existing.room.name,
          },
          isPaired: true,
        });
      }
    }

    const deviceName = body.deviceName || 'TV-1';
    const { session, pairingCode, expiresAt } = await createTvSession(deviceName);

    return NextResponse.json({
      session: {
        id: session.id,
        token: session.token,
        deviceName: session.deviceName,
        status: session.status,
      },
      pairingCode,
      expiresAt: expiresAt.toISOString(),
      isPaired: false,
    });
  } catch (err: any) {
    console.error('Error creating TV pairing code:', err);
    return NextResponse.json(
      { error: err.message || 'Nem sikerült legenerálni a TV párosítási kódot.' },
      { status: 500 }
    );
  }
}
