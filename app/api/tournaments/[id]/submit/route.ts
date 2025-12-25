import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { emitTournamentLeaderboard } from '@/lib/realtime';
import { cacheDelete } from '@/lib/redis';

// ============================================
// POST /api/tournaments/[id]/submit - Submit score
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { score, time } = body;

    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid score' },
        { status: 400 }
      );
    }

    // Get tournament
    const tournament = await db.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if tournament is active
    const now = new Date();
    if (now < tournament.startTime) {
      return NextResponse.json(
        { success: false, error: 'Tournament has not started yet' },
        { status: 400 }
      );
    }
    if (now > tournament.endTime) {
      return NextResponse.json(
        { success: false, error: 'Tournament has ended' },
        { status: 400 }
      );
    }

    // Get user's entry
    const entry = await db.tournamentEntry.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: session.user.id,
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Not registered for this tournament' },
        { status: 400 }
      );
    }

    // Check attempts limit
    if (entry.attempts >= tournament.attemptsPerPlayer) {
      return NextResponse.json(
        { success: false, error: 'No attempts remaining' },
        { status: 400 }
      );
    }

    // Update entry with new score if better
    const updatedEntry = await db.tournamentEntry.update({
      where: { id: entry.id },
      data: {
        score: Math.max(entry.score, score),
        attempts: entry.attempts + 1,
        bestTime: time
          ? entry.bestTime
            ? Math.min(entry.bestTime, time)
            : time
          : entry.bestTime,
        lastAttemptAt: new Date(),
      },
    });

    // Calculate new rank
    const betterEntries = await db.tournamentEntry.count({
      where: {
        tournamentId: id,
        score: { gt: updatedEntry.score },
      },
    });
    const newRank = betterEntries + 1;

    // Update rank
    await db.tournamentEntry.update({
      where: { id: entry.id },
      data: { rank: newRank },
    });

    // Emit real-time leaderboard update
    const topEntries = await db.tournamentEntry.findMany({
      where: { tournamentId: id },
      orderBy: [{ score: 'desc' }, { bestTime: 'asc' }],
      take: 10,
    });

    // Get usernames for top entries
    const userIds = topEntries.map((e) => e.userId);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    emitTournamentLeaderboard({
      tournamentId: id,
      topEntries: topEntries.map((e, index) => ({
        rank: index + 1,
        userId: e.userId,
        username: userMap.get(e.userId) || 'Anonymous',
        score: e.score,
        bestTime: e.bestTime ?? undefined,
      })),
    });

    // Invalidate leaderboard cache
    await cacheDelete(`tournament:${id}:leaderboard:50:0`);

    return NextResponse.json({
      success: true,
      entry: {
        ...updatedEntry,
        rank: newRank,
      },
      isNewHighScore: score > entry.score,
      attemptsRemaining: tournament.attemptsPerPlayer - updatedEntry.attempts,
    });
  } catch (error) {
    console.error('Failed to submit score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}
