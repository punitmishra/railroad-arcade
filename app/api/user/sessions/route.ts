import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');
    const includeEvents = searchParams.get('includeEvents') === 'true';

    // Validate and parse limit
    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, MAX_LIMIT);
      }
    }

    // Build query with cursor-based pagination
    const playSessions = await db.playSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startTime: 'desc' },
      take: limit + 1, // Fetch one extra to determine if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
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
        ...(includeEvents && {
          events: {
            select: {
              id: true,
              type: true,
              description: true,
              trainId: true,
              level: true,
              timestamp: true,
            },
            orderBy: { timestamp: 'asc' },
          },
        }),
        gameSession: {
          select: {
            id: true,
            gameMode: true,
            score: true,
            isLive: true,
          },
        },
      },
    });

    // Determine if there are more results
    const hasMore = playSessions.length > limit;
    const sessions = hasMore ? playSessions.slice(0, -1) : playSessions;
    const nextCursor = hasMore ? sessions[sessions.length - 1]?.id : null;

    // Get total count for the user (optional, can be expensive)
    const totalCount = await db.playSession.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        pagination: {
          nextCursor,
          hasMore,
          limit,
          totalCount,
        },
      },
    });
  } catch (error) {
    logger.error('Sessions fetch error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
