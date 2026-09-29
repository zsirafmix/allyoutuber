import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bootstrapToken, sessionToken } = body;

    const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (!expectedToken || bootstrapToken !== expectedToken) {
      return NextResponse.json({ error: 'Invalid admin bootstrap token.' }, { status: 403 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Session not found. Please pick a nickname first.' }, { status: 400 });
    }

    // Elevate user to global admin
    await prisma.user.update({
      where: { id: session.userId },
      data: { isGlobalAdmin: true },
    });

    // Record in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userNick: session.nickname,
        action: 'BOOTSTRAP_GLOBAL_ADMIN',
        details: JSON.stringify({ userId: session.userId, nickname: session.nickname }),
      },
    });

    return NextResponse.json({ success: true, message: `${session.nickname} is now a Global Admin.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
