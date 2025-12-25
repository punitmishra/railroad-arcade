// ============================================
// Games API
// ============================================
// POST: Start a new game session
// PUT: End a game session with final score
// GET: Get user's game sessions

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { GAME_MODE_CONFIGS } from '@/lib/game-modes/GameModeEngine';
import { Prisma, GameMode } from '@prisma/client';

// ============================================
// POST - Start Game Session
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gameMode, isLive = false, playSessionId } = body;

    // Validate game mode
    const config = GAME_MODE_CONFIGS[gameMode as keyof typeof GAME_MODE_CONFIGS];
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Invalid game mode' },
        { status: 400 }
      );
    }

    // Check token balance for paid modes
    if (isLive && config.tokenCost > 0) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { tokenBalance: true },
      });

      if (!user || user.tokenBalance < config.tokenCost) {
        return NextResponse.json(
          { success: false, error: 'Insufficient tokens' },
          { status: 402 }
        );
      }

      // Deduct tokens
      await db.user.update({
        where: { id: session.user.id },
        data: {
          tokenBalance: { decrement: config.tokenCost },
          totalTokensUsed: { increment: config.tokenCost },
        },
      });
    }

    // Create game session
    const gameSession = await db.gameSession.create({
      data: {
        userId: session.user.id,
        gameMode: gameMode,
        isLive,
        playSessionId: playSessionId || null,
        score: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: gameSession.id,
        gameMode: gameSession.gameMode,
        isLive: gameSession.isLive,
        tokenCost: config.tokenCost,
      },
    });
  } catch (error) {
    console.error('Start game session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start game session' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - End Game Session
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, score, metadata } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Find and verify game session
    const gameSession = await db.gameSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
        endTime: null, // Not already ended
      },
    });

    if (!gameSession) {
      return NextResponse.json(
        { success: false, error: 'Game session not found' },
        { status: 404 }
      );
    }

    // Update game session with final score
    const updatedSession = await db.gameSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        score: score || 0,
        metadata: metadata || null,
      },
    });

    // Check if this is a new high score
    const existingHighScore = await db.leaderboard.findUnique({
      where: {
        userId_gameMode_isLive: {
          userId: session.user.id,
          gameMode: gameSession.gameMode,
          isLive: gameSession.isLive,
        },
      },
    });

    const isNewHighScore = !existingHighScore || score > existingHighScore.score;

    // Auto-submit to leaderboard if it's a high score
    if (isNewHighScore && score > 0) {
      await db.leaderboard.upsert({
        where: {
          userId_gameMode_isLive: {
            userId: session.user.id,
            gameMode: gameSession.gameMode,
            isLive: gameSession.isLive,
          },
        },
        create: {
          userId: session.user.id,
          gameMode: gameSession.gameMode,
          isLive: gameSession.isLive,
          score,
        },
        update: {
          score,
          achievedAt: new Date(),
        },
      });
    }

    // Get rank
    const rank = await db.leaderboard.count({
      where: {
        gameMode: gameSession.gameMode,
        isLive: gameSession.isLive,
        score: { gt: score },
      },
    }) + 1;

    return NextResponse.json({
      success: true,
      data: {
        sessionId: updatedSession.id,
        finalScore: score,
        isNewHighScore,
        previousHighScore: existingHighScore?.score || 0,
        rank,
        duration: updatedSession.endTime && updatedSession.startTime
          ? Math.floor((updatedSession.endTime.getTime() - updatedSession.startTime.getTime()) / 1000)
          : 0,
      },
    });
  } catch (error) {
    console.error('End game session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to end game session' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Get User's Game Sessions
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const gameModeParam = searchParams.get('mode');

    const where: Prisma.GameSessionWhereInput = { userId: session.user.id };
    if (gameModeParam && Object.values(GameMode).includes(gameModeParam as GameMode)) {
      where.gameMode = gameModeParam as GameMode;
    }

    const gameSessions = await db.gameSession.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: limit,
      select: {
        id: true,
        gameMode: true,
        startTime: true,
        endTime: true,
        score: true,
        isLive: true,
        metadata: true,
      },
    });

    // Get high scores for each mode
    const highScores = await db.leaderboard.findMany({
      where: { userId: session.user.id },
      select: {
        gameMode: true,
        score: true,
        isLive: true,
      },
    });

    const highScoreMap: Record<string, { demo: number; live: number }> = {};
    for (const hs of highScores) {
      if (!highScoreMap[hs.gameMode]) {
        highScoreMap[hs.gameMode] = { demo: 0, live: 0 };
      }
      if (hs.isLive) {
        highScoreMap[hs.gameMode].live = hs.score;
      } else {
        highScoreMap[hs.gameMode].demo = hs.score;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sessions: gameSessions.map((s) => ({
          id: s.id,
          gameMode: s.gameMode,
          startTime: s.startTime,
          endTime: s.endTime,
          score: s.score,
          isLive: s.isLive,
          duration: s.endTime && s.startTime
            ? Math.floor((s.endTime.getTime() - s.startTime.getTime()) / 1000)
            : null,
        })),
        highScores: highScoreMap,
      },
    });
  } catch (error) {
    console.error('Get game sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game sessions' },
      { status: 500 }
    );
  }
}
