import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/redis';

// ============================================
// GET /api/tournaments/[id]/leaderboard
// ============================================
// Dedicated endpoint for tournament leaderboards with
// pagination and current user context.

interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  score: number;
  attempts: number;
  bestTime: number | null;
  rank: number;
  registeredAt: Date;
  lastAttemptAt: Date | null;
}

interface LeaderboardResponse {
  success: boolean;
  leaderboard: {
    tournamentId: string;
    entries: LeaderboardEntry[];
    totalParticipants: number;
    userEntry?: LeaderboardEntry;
    userRank?: number;
  };
}

const CACHE_TTL = 30; // 30 seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<LeaderboardResponse | { success: false; error: string }>> {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination params
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check cache first (only for first page without user context)
    const cacheKey = `tournament:${id}:leaderboard:${limit}:${offset}`;
    if (!session?.user?.id && offset === 0) {
      const cached = await cacheGet<LeaderboardResponse['leaderboard']>(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, leaderboard: cached });
      }
    }

    // Verify tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { entries: true } },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Fetch leaderboard entries
    const entries = await db.tournamentEntry.findMany({
      where: { tournamentId: id },
      orderBy: [
        { score: 'desc' },
        { bestTime: 'asc' }, // Tiebreaker: faster time wins
        { registeredAt: 'asc' }, // Second tiebreaker: earlier registration
      ],
      skip: offset,
      take: limit,
      select: {
        id: true,
        userId: true,
        score: true,
        attempts: true,
        bestTime: true,
        registeredAt: true,
        lastAttemptAt: true,
      },
    });

    // Get user info for entries
    const userIds = entries.map((e) => e.userId);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Build leaderboard with ranks
    const leaderboardEntries: LeaderboardEntry[] = entries.map((entry, index) => ({
      id: entry.id,
      userId: entry.userId,
      username: userMap.get(entry.userId)?.name || 'Anonymous',
      avatar: userMap.get(entry.userId)?.image || null,
      score: entry.score,
      attempts: entry.attempts,
      bestTime: entry.bestTime,
      rank: offset + index + 1, // Rank based on position + offset
      registeredAt: entry.registeredAt,
      lastAttemptAt: entry.lastAttemptAt,
    }));

    // Get current user's entry if logged in
    let userEntry: LeaderboardEntry | undefined;
    let userRank: number | undefined;

    if (session?.user?.id) {
      // Check if user is in current page
      const userInPage = leaderboardEntries.find((e) => e.userId === session.user.id);

      if (userInPage) {
        userEntry = userInPage;
        userRank = userInPage.rank;
      } else {
        // User not in current page, fetch their entry separately
        const userEntryData = await db.tournamentEntry.findUnique({
          where: {
            tournamentId_userId: {
              tournamentId: id,
              userId: session.user.id,
            },
          },
          select: {
            id: true,
            userId: true,
            score: true,
            attempts: true,
            bestTime: true,
            registeredAt: true,
            lastAttemptAt: true,
          },
        });

        if (userEntryData) {
          // Calculate user's rank
          const entriesAbove = await db.tournamentEntry.count({
            where: {
              tournamentId: id,
              OR: [
                { score: { gt: userEntryData.score } },
                {
                  score: userEntryData.score,
                  bestTime: userEntryData.bestTime
                    ? { lt: userEntryData.bestTime }
                    : undefined,
                },
              ],
            },
          });

          userRank = entriesAbove + 1;

          const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, image: true },
          });

          userEntry = {
            id: userEntryData.id,
            userId: userEntryData.userId,
            username: user?.name || 'Anonymous',
            avatar: user?.image || null,
            score: userEntryData.score,
            attempts: userEntryData.attempts,
            bestTime: userEntryData.bestTime,
            rank: userRank,
            registeredAt: userEntryData.registeredAt,
            lastAttemptAt: userEntryData.lastAttemptAt,
          };
        }
      }
    }

    const response: LeaderboardResponse['leaderboard'] = {
      tournamentId: id,
      entries: leaderboardEntries,
      totalParticipants: tournament._count.entries,
      userEntry,
      userRank,
    };

    // Cache result for non-authenticated requests
    if (!session?.user?.id) {
      await cacheSet(cacheKey, response, CACHE_TTL);
    }

    return NextResponse.json({ success: true, leaderboard: response });
  } catch (error) {
    console.error('Failed to fetch tournament leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
