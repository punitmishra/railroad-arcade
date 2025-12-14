import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiRateLimit, playSessionCache, userCache } from '@/lib/redis';
import { queue } from '@/lib/queue';

// GET /api/sessions - Get user's session history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const cursor = searchParams.get('cursor');

    const sessions = await db.playSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        events: {
          orderBy: { timestamp: 'asc' },
          take: 50,
        },
        _count: {
          select: { events: true },
        },
      },
    });

    const hasMore = sessions.length > limit;
    const items = hasMore ? sessions.slice(0, -1) : sessions;

    return NextResponse.json({
      sessions: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Start a new play session
export async function POST(request: NextRequest) {
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

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { duration, tokenCost } = body;

    // Validate input
    if (!duration || duration < 60 || duration > 3600) {
      return NextResponse.json(
        { error: 'Invalid session duration' },
        { status: 400 }
      );
    }

    if (!tokenCost || tokenCost < 1) {
      return NextResponse.json(
        { error: 'Invalid token cost' },
        { status: 400 }
      );
    }

    // Check if user already has an active session
    const existingActiveSession = await playSessionCache.getUserActiveSession(
      session.user.id
    );
    if (existingActiveSession) {
      return NextResponse.json(
        { error: 'You already have an active session' },
        { status: 400 }
      );
    }

    // Check user's token balance
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { tokenBalance: true },
    });

    if (!user || user.tokenBalance < tokenCost) {
      return NextResponse.json(
        { error: 'Insufficient tokens' },
        { status: 400 }
      );
    }

    // Create the session and deduct tokens in a transaction
    const [playSession] = await db.$transaction([
      db.playSession.create({
        data: {
          userId: session.user.id,
          tokensSpent: tokenCost,
          status: 'ACTIVE',
        },
      }),
      db.user.update({
        where: { id: session.user.id },
        data: {
          tokenBalance: { decrement: tokenCost },
        },
      }),
      db.transaction.create({
        data: {
          userId: session.user.id,
          type: 'SPEND',
          amount: -tokenCost,
          status: 'COMPLETED',
          metadata: { reason: 'session_start' },
        },
      }),
    ]);

    // Cache the active session
    await playSessionCache.setActive(playSession.id, {
      userId: session.user.id,
      startTime: Date.now(),
      tokensSpent: tokenCost,
      trainsActive: [],
    });
    await playSessionCache.setUserActiveSession(session.user.id, playSession.id);

    // Invalidate user cache
    await userCache.invalidateBalance(session.user.id);

    // Get updated token balance
    const updatedUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { tokenBalance: true },
    });

    return NextResponse.json({
      sessionId: playSession.id,
      expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
      tokenBalance: updatedUser?.tokenBalance ?? 0,
    });
  } catch (error) {
    console.error('Start session error:', error);
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions - End the current active session
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, status = 'COMPLETED', totalDistance = 0 } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const playSession = await db.playSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
        status: 'ACTIVE',
      },
    });

    if (!playSession) {
      return NextResponse.json(
        { error: 'Active session not found' },
        { status: 404 }
      );
    }

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - playSession.startTime.getTime()) / 1000
    );

    // Update the session
    const updatedSession = await db.playSession.update({
      where: { id: sessionId },
      data: {
        endTime,
        duration,
        status: status as 'COMPLETED' | 'INTERRUPTED' | 'EMERGENCY_STOPPED',
        totalDistance,
      },
    });

    // Clear caches
    await playSessionCache.clearSession(sessionId);
    await playSessionCache.clearUserActiveSession(session.user.id);

    // Queue session archival and achievement check
    await queue.archiveSession({
      sessionId,
      userId: session.user.id,
    });
    await queue.checkAchievements({
      userId: session.user.id,
      sessionId,
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('End session error:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
