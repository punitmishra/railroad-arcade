import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiRateLimit } from '@/lib/redis';
import {
  getQueueState,
  getUserQueuePosition,
  joinQueue,
  leaveQueue,
} from '@/lib/queue-manager';

// ============================================
// GET /api/queue - Get queue state
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = await apiRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Get session (optional for queue state)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get queue state
    const queueState = await getQueueState();

    // Get user's position if logged in
    let userPosition = null;
    if (userId) {
      userPosition = await getUserQueuePosition(userId);
    }

    return NextResponse.json({
      success: true,
      data: {
        queue: {
          totalInQueue: queueState.totalInQueue,
          currentController: queueState.currentController
            ? {
                position: 0,
                controlEndsAt: queueState.currentController.controlEndsAt,
                // Don't expose userId to others
              }
            : null,
          waitingCount: queueState.waitingUsers.length,
          averageWaitTime: queueState.averageSessionDuration,
        },
        userPosition,
      },
    });
  } catch (error) {
    console.error('Queue GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/queue - Join queue
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success: rateLimitSuccess } = await apiRateLimit.limit(ip);
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { timePackageId } = body;

    if (!timePackageId) {
      return NextResponse.json(
        { error: 'Time package ID required' },
        { status: 400 }
      );
    }

    const result = await joinQueue(session.user.id, timePackageId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.entry,
    });
  } catch (error) {
    console.error('Queue POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/queue - Leave queue
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success: rateLimitSuccess } = await apiRateLimit.limit(ip);
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await leaveQueue(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        refunded: result.refunded,
      },
    });
  } catch (error) {
    console.error('Queue DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
