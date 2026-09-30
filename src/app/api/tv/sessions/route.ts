import { NextRequest, NextResponse } from 'next/server';
import { getRoomTvSessions } from '@/lib/tv';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId paraméter kötelező.' }, { status: 400 });
    }

    const sessions = await getRoomTvSessions(roomId);

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        deviceName: s.deviceName,
        status: s.status,
        roomId: s.roomId,
        pairedAt: s.pairedAt,
        lastSeenAt: s.lastSeenAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Nem sikerült lekérdezni a TV sessionöket.' },
      { status: 500 }
    );
  }
}
