// ============================================
// Priority Queue API
// ============================================
// Join the queue with priority (skip ahead).

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { joinPriorityQueue } from '@/lib/queue-manager';

export const dynamic = 'force-dynamic';

/**
 * POST /api/queue/priority
 * Join the queue with priority status
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { timePackageId, priorityLevel } = body;

    if (!timePackageId) {
      return NextResponse.json(
        { error: 'timePackageId is required' },
        { status: 400 }
      );
    }

    // Validate priority level
    const level = priorityLevel ?? 1;
    if (![1, 2, 3].includes(level)) {
      return NextResponse.json(
        { error: 'priorityLevel must be 1, 2, or 3' },
        { status: 400 }
      );
    }

    const result = await joinPriorityQueue(
      session.user.id,
      timePackageId,
      level as 1 | 2 | 3
    );

    if (!result.success) {
      if (result.hardwareOffline) {
        return NextResponse.json(
          { error: result.error, hardwareOffline: true },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: result.entry,
      message: `Joined queue with priority level ${level}`,
    });
  } catch (error) {
    console.error('[Queue] Priority join error:', error);
    return NextResponse.json(
      { error: 'Failed to join priority queue' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/queue/priority
 * Get priority queue pricing info
 */
export async function GET() {
  // Return priority pricing info
  const pricing = [
    {
      level: 1,
      name: 'Priority',
      description: 'Skip ahead of regular queue',
      multiplier: 2,
      badge: 'PRIORITY',
    },
    {
      level: 2,
      name: 'Express',
      description: 'Skip ahead of Priority users',
      multiplier: 3,
      badge: 'EXPRESS',
    },
    {
      level: 3,
      name: 'VIP',
      description: 'Maximum priority, skip everyone',
      multiplier: 5,
      badge: 'VIP',
    },
  ];

  return NextResponse.json({ pricing });
}
