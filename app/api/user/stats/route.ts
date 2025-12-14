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

    // Get user stats
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        playSessions: {
          select: {
            totalDistance: true,
            modulesUsed: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Calculate stats
    const totalDistance = user.playSessions.reduce((sum, s) => sum + s.totalDistance, 0);

    // Count module usage
    const moduleCounts: Record<string, number> = {};
    user.playSessions.forEach(s => {
      s.modulesUsed.forEach(m => {
        moduleCounts[m] = (moduleCounts[m] || 0) + 1;
      });
    });

    const favoriteModule = Object.entries(moduleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'trains';

    return NextResponse.json({
      success: true,
      data: {
        totalSessions: user.totalSessions,
        totalTokensUsed: user.totalTokensUsed,
        totalDistance,
        favoriteModule,
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
