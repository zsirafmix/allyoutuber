import { NextRequest, NextResponse } from 'next/server';
import { claimPairingCode } from '@/lib/tv';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const session = token ? await getSession(token) : null;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'unknown-ip';

    const body = await req.json().catch(() => ({}));
    const { pairingCode, roomId, deviceName } = body;

    if (!pairingCode) {
      return NextResponse.json({ error: 'A párosítási kód megadása kötelező.' }, { status: 400 });
    }

    if (!roomId) {
      return NextResponse.json({ error: 'A cél szoba azonosítója hiányzik.' }, { status: 400 });
    }

    const { session: pairedSession, room } = await claimPairingCode(
      pairingCode,
      roomId,
      session?.userId,
      deviceName,
      ip
    );

    return NextResponse.json({
      success: true,
      tvSession: {
        id: pairedSession.id,
        deviceName: pairedSession.deviceName,
        roomId: pairedSession.roomId,
        status: pairedSession.status,
      },
      room: {
        id: room.id,
        slug: room.slug,
        name: room.name,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'A párosítás sikertelen.' },
      { status: 400 }
    );
  }
}
