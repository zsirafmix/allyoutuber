import { NextRequest, NextResponse } from 'next/server';
import { createSessionForNickname, getSession, updateUserNickname } from '@/lib/session';
import { getClientIp } from '@/lib/geoIp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nickname } = body;

    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: 'Valid nickname is required.' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = getClientIp(req);

    const { sessionToken, user } = await createSessionForNickname(nickname, userAgent, ipAddress);

    const res = NextResponse.json({ sessionToken, user });
    res.cookies.set('allyoutuber_token', sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60,
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

    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = getClientIp(req);

    const session = await getSession(token, userAgent, ipAddress);
    return NextResponse.json({ session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const tokenFromCookie = req.cookies.get('allyoutuber_token')?.value;
    const token = tokenFromHeader || tokenFromCookie;

    const res = NextResponse.json({ success: true, message: 'Kijelentkezve.' });
    res.cookies.set('allyoutuber_token', '', {
      maxAge: 0,
      path: '/',
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const tokenFromCookie = req.cookies.get('allyoutuber_token')?.value;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      return NextResponse.json({ error: 'Nincs érvényes munkamenet azonosító.' }, { status: 401 });
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = getClientIp(req);
    const session = await getSession(token, userAgent, ipAddress);
    if (!session) {
      return NextResponse.json({ error: 'Érvénytelen vagy lejárt munkamenet.' }, { status: 401 });
    }

    const body = await req.json();
    const { nickname } = body;

    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: 'Érvényes nicknév megadása kötelező.' }, { status: 400 });
    }

    const updatedUser = await updateUserNickname(session.userId, nickname);

    const res = NextResponse.json({
      success: true,
      sessionToken: token,
      user: updatedUser,
      message: 'Nicknév sikeresen módosítva.',
    });

    res.cookies.set('allyoutuber_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Hiba történt a nicknév módosításakor.' }, { status: 400 });
  }
}
