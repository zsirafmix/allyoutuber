import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('allyoutuber_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const session = token ? await getSession(token) : null;

    if (!session || !session.isGlobalAdmin) {
      return NextResponse.json({ error: 'Csak főadmin jogosultsággal módosítható a rendszergazdai rang.' }, { status: 403 });
    }

    const userId = params.id;
    const body = await req.json();
    const { isGlobalAdmin } = body;

    if (typeof isGlobalAdmin !== 'boolean') {
      return NextResponse.json({ error: 'Az isGlobalAdmin logikai érték megadása kötelező.' }, { status: 400 });
    }

    // Do not allow revoking admin status from oneself
    if (session.userId === userId && !isGlobalAdmin) {
      return NextResponse.json({ error: 'Nem vonhatod meg a saját főadmin jogosultságodat.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'A megadott felhasználó nem található.' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isGlobalAdmin },
      select: {
        id: true,
        nickname: true,
        isGlobalAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userNick: session.nickname,
        action: isGlobalAdmin ? 'GRANT_GLOBAL_ADMIN' : 'REVOKE_GLOBAL_ADMIN',
        details: JSON.stringify({ targetUserId: userId, targetNick: targetUser.nickname }),
      },
    });

    return NextResponse.json({
      success: true,
      message: isGlobalAdmin
        ? `${targetUser.nickname} sikeresen előléptetve Főadminisztrátorrá.`
        : `${targetUser.nickname} főadminisztrátori joga visszavonva.`,
      user: updatedUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
