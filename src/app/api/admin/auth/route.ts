import { NextRequest, NextResponse } from 'next/server';
import { isAdminInitialized, setupInitialAdmin, loginPermanentAdmin } from '@/lib/adminAuth';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const { initialized, username } = await isAdminInitialized();

    const token = req.cookies.get('allyoutuber_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const session = token ? await getSession(token) : null;
    const isAuthenticated = !!(session && session.isGlobalAdmin);

    return NextResponse.json({
      initialized,
      username,
      isAuthenticated,
      user: isAuthenticated ? { id: session.userId, nickname: session.nickname } : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, nickname, password } = body;

    if (action === 'setup') {
      const { sessionToken, user } = await setupInitialAdmin(nickname, password);
      const res = NextResponse.json({ success: true, user });
      res.cookies.set('allyoutuber_token', sessionToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 24 * 60 * 60,
        path: '/',
      });
      return res;
    } else if (action === 'login') {
      const { sessionToken, user } = await loginPermanentAdmin(password);
      const res = NextResponse.json({ success: true, user });
      res.cookies.set('allyoutuber_token', sessionToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 24 * 60 * 60,
        path: '/',
      });
      return res;
    } else {
      return NextResponse.json({ error: 'Érvénytelen művelet.' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
