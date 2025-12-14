import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's play sessions
    const playSessions = await db.playSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startTime: 'desc' },
      take: 50, // Last 50 sessions
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        tokensSpent: true,
        status: true,
        totalDistance: true,
        trainsOperated: true,
        modulesUsed: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: playSessions,
      },
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
