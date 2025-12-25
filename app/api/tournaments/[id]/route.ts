import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// ============================================
// GET /api/tournaments/[id] - Get tournament details
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { score: 'desc' },
          take: 50,
          select: {
            id: true,
            userId: true,
            score: true,
            attempts: true,
            bestTime: true,
            rank: true,
            registeredAt: true,
            lastAttemptAt: true,
          },
        },
        _count: { select: { entries: true } },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get user names for leaderboard
    const userIds = tournament.entries.map((e) => e.userId);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = tournament.entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      username: userMap.get(entry.userId)?.name || 'Anonymous',
      avatar: userMap.get(entry.userId)?.image,
    }));

    // Check if current user is registered
    let isRegistered = false;
    let userEntry = null;

    if (session?.user?.id) {
      const entry = tournament.entries.find((e) => e.userId === session.user.id);
      if (entry) {
        isRegistered = true;
        userEntry = {
          ...entry,
          rank: leaderboard.findIndex((e) => e.userId === session.user.id) + 1,
        };
      }
    }

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        type: tournament.type,
        status: tournament.status,
        gameMode: tournament.gameMode,
        registrationStart: tournament.registrationStart,
        registrationEnd: tournament.registrationEnd,
        startTime: tournament.startTime,
        endTime: tournament.endTime,
        maxParticipants: tournament.maxParticipants,
        entryFee: tournament.entryFee,
        minLevel: tournament.minLevel,
        attemptsPerPlayer: tournament.attemptsPerPlayer,
        prizePool: tournament.prizePool,
        prizes: tournament.prizes,
        participantCount: tournament._count.entries,
        isRegistered,
        userEntry,
      },
      leaderboard,
    });
  } catch (error) {
    console.error('Failed to fetch tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}
