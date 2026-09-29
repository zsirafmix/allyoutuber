import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      service: 'AllYouTuber',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'AllYouTuber',
        database: 'unreachable',
        error: err.message,
      },
      { status: 503 }
    );
  }
}
