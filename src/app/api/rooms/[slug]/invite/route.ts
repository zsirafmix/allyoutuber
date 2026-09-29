import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { regenerateRoomInvite } from '@/lib/room';
import { getSession } from '@/lib/session';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const token = req.cookies.get('allyoutuber_token')?.value;
    const session = token ? await getSession(token) : null;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const room = await prisma.room.findUnique({ where: { slug: params.slug } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    const newCode = await regenerateRoomInvite(room.id, session.userId);
    return NextResponse.json({ inviteCode: newCode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
