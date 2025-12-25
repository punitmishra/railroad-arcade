import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { TournamentStatus } from '@prisma/client';

// ============================================
// GET /api/tournaments - List tournaments
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as TournamentStatus | null;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Build where clause
    const where: { status?: TournamentStatus | { in: TournamentStatus[] } } = {};
    if (status) {
      where.status = status;
    } else {
      // By default, show active, registration, and scheduled tournaments
      where.status = { in: ['ACTIVE', 'REGISTRATION', 'SCHEDULED'] };
    }

    const tournaments = await db.tournament.findMany({
      where,
      orderBy: { startTime: 'asc' },
      take: limit,
      include: {
        _count: { select: { entries: true } },
      },
    });

    // Check if user is registered for each tournament
    const tournamentData = await Promise.all(
      tournaments.map(async (t) => {
        let isRegistered = false;
        let userEntry = null;

        if (session?.user?.id) {
          const entry = await db.tournamentEntry.findUnique({
            where: {
              tournamentId_userId: {
                tournamentId: t.id,
                userId: session.user.id,
              },
            },
          });
          isRegistered = !!entry;
          userEntry = entry;
        }

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          type: t.type,
          status: t.status,
          gameMode: t.gameMode,
          registrationStart: t.registrationStart,
          registrationEnd: t.registrationEnd,
          startTime: t.startTime,
          endTime: t.endTime,
          maxParticipants: t.maxParticipants,
          entryFee: t.entryFee,
          minLevel: t.minLevel,
          attemptsPerPlayer: t.attemptsPerPlayer,
          prizePool: t.prizePool,
          prizes: t.prizes,
          participantCount: t._count.entries,
          isRegistered,
          userEntry,
        };
      })
    );

    return NextResponse.json({
      success: true,
      tournaments: tournamentData,
    });
  } catch (error) {
    console.error('Failed to fetch tournaments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/tournaments - Create tournament (admin only)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add proper admin check
    // For now, just check for a specific header/key
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      gameMode,
      registrationStart,
      registrationEnd,
      startTime,
      endTime,
      maxParticipants,
      entryFee,
      minLevel,
      attemptsPerPlayer,
      prizePool,
      prizes,
    } = body;

    const tournament = await db.tournament.create({
      data: {
        name,
        description,
        type,
        gameMode,
        registrationStart: new Date(registrationStart),
        registrationEnd: new Date(registrationEnd),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxParticipants: maxParticipants || 100,
        entryFee: entryFee || 0,
        minLevel: minLevel || 1,
        attemptsPerPlayer: attemptsPerPlayer || 3,
        prizePool: prizePool || 0,
        prizes,
      },
    });

    return NextResponse.json({
      success: true,
      tournament,
    });
  } catch (error) {
    console.error('Failed to create tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}
