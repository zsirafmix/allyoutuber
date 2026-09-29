import { NextRequest, NextResponse } from 'next/server';
import { createSessionForNickname, getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nickname } = body;

    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: 'Valid nickname is required.' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = req.headers.get('x-forwarded-for') || undefined;

    const { sessionToken, user } = await createSessionForNickname(nickname, userAgent, ipAddress);

    const res = NextResponse.json({ sessionToken, user });
    res.cookies.set('allyoutuber_token', sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Session error.' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const tokenFromCookie = req.cookies.get('allyoutuber_token')?.value;

    const token = tokenFromHeader || tokenFromCookie;
    if (!token) {
      return NextResponse.json({ session: null });
    }

    const session = await getSession(token);
    return NextResponse.json({ session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
