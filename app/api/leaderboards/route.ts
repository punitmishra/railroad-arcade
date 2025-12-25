// ============================================
// Leaderboard API
// ============================================
// GET: Fetch leaderboard entries
// POST: Submit a new score

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { emitLeaderboardUpdate } from '@/lib/realtime';
import { GameMode } from '@prisma/client';

// ============================================
// GET - Fetch Leaderboard
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const gameModeParam = searchParams.get('mode') || 'FREE_PLAY';
    const isLive = searchParams.get('live') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);

    // Validate game mode
    const validGameModes = Object.values(GameMode);
    const gameMode = validGameModes.includes(gameModeParam as GameMode)
      ? (gameModeParam as GameMode)
      : GameMode.FREE_PLAY;

    // Get leaderboard entries
    const entries = await db.leaderboard.findMany({
      where: {
        gameMode,
        isLive,
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Format response
    const leaderboard = entries.map((entry, index) => ({
      rank: index + 1,
      score: entry.score,
      achievedAt: entry.achievedAt,
      user: {
        id: entry.user.id,
        name: entry.user.name || 'Anonymous',
        image: entry.user.image,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        gameMode,
        isLive,
        entries: leaderboard,
      },
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Submit Score
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gameMode, score, isLive = false } = body;

    // Validate input
    if (!gameMode || typeof score !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      );
    }

    // Check if this is a new high score for the user
    const existing = await db.leaderboard.findUnique({
      where: {
        userId_gameMode_isLive: {
          userId: session.user.id,
          gameMode,
          isLive,
        },
      },
    });

    if (existing && existing.score >= score) {
      // Not a new high score
      return NextResponse.json({
        success: true,
        data: {
          newHighScore: false,
          currentHighScore: existing.score,
          submittedScore: score,
        },
      });
    }

    // Update or create leaderboard entry
    const entry = await db.leaderboard.upsert({
      where: {
        userId_gameMode_isLive: {
          userId: session.user.id,
          gameMode,
          isLive,
        },
      },
      create: {
        userId: session.user.id,
        gameMode,
        score,
        isLive,
      },
      update: {
        score,
        achievedAt: new Date(),
      },
    });

    // Get updated rankings to emit
    const topEntries = await db.leaderboard.findMany({
      where: { gameMode, isLive },
      orderBy: { score: 'desc' },
      take: 10,
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // Emit leaderboard update
    emitLeaderboardUpdate({
      gameMode,
      isLive,
      entries: topEntries.map((e, i) => ({
        rank: i + 1,
        userId: e.user.id,
        username: e.user.name || 'Anonymous',
        score: e.score,
      })),
    });

    // Calculate new rank
    const rank = await db.leaderboard.count({
      where: {
        gameMode,
        isLive,
        score: { gt: score },
      },
    }) + 1;

    return NextResponse.json({
      success: true,
      data: {
        newHighScore: true,
        previousHighScore: existing?.score || 0,
        newScore: score,
        rank,
      },
    });
  } catch (error) {
    console.error('Score submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}
