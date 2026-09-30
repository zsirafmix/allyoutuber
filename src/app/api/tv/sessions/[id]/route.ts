import { NextRequest, NextResponse } from 'next/server';
import { disconnectTvSession, updateTvSessionName } from '@/lib/tv';
import { getSession } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    const body = await req.json().catch(() => ({}));
    const { deviceName } = body;

    if (!deviceName) {
      return NextResponse.json({ error: 'A TV neve kötelező.' }, { status: 400 });
    }

    const updated = await updateTvSessionName(sessionId, deviceName);
    return NextResponse.json({ success: true, session: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Nem sikerült módosítani a TV nevét.' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const session = token ? await getSession(token) : null;

    const disconnected = await disconnectTvSession(sessionId, session?.userId);
    return NextResponse.json({ success: true, session: disconnected });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Nem sikerült leválasztani a TV-t.' },
      { status: 400 }
    );
  }
}
