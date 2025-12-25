import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// ============================================
// POST /api/tournaments/[id]/register - Register for tournament
// ============================================

// Calculate user level based on total sessions
// Level 1: 0-9 sessions
// Level 2: 10-29 sessions
// Level 3: 30-59 sessions
// Level 4: 60-99 sessions
// Level 5: 100+ sessions
function calculateUserLevel(totalSessions: number): number {
  if (totalSessions >= 100) return 5;
  if (totalSessions >= 60) return 4;
  if (totalSessions >= 30) return 3;
  if (totalSessions >= 10) return 2;
  return 1;
}

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

    // Get tournament
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        _count: { select: { entries: true } },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if registration is open
    const now = new Date();
    if (now < tournament.registrationStart) {
      return NextResponse.json(
        { success: false, error: 'Registration has not started yet' },
        { status: 400 }
      );
    }
    if (now > tournament.registrationEnd) {
      return NextResponse.json(
        { success: false, error: 'Registration has ended' },
        { status: 400 }
      );
    }

    // Check if tournament is full
    if (tournament._count.entries >= tournament.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Tournament is full' },
        { status: 400 }
      );
    }

    // Check if user is already registered
    const existingEntry = await db.tournamentEntry.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Already registered' },
        { status: 400 }
      );
    }

    // Check user's token balance and level
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { tokenBalance: true, totalSessions: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check level requirement
    if (tournament.minLevel > 1) {
      const userLevel = calculateUserLevel(user.totalSessions);
      if (userLevel < tournament.minLevel) {
        return NextResponse.json(
          {
            success: false,
            error: `Requires level ${tournament.minLevel}. You are level ${userLevel}.`,
            currentLevel: userLevel,
            requiredLevel: tournament.minLevel,
          },
          { status: 400 }
        );
      }
    }

    // Check token balance
    if (user.tokenBalance < tournament.entryFee) {
      return NextResponse.json(
        { success: false, error: 'Insufficient tokens' },
        { status: 400 }
      );
    }

    // Deduct entry fee and create registration
    await db.$transaction([
      db.user.update({
        where: { id: session.user.id },
        data: {
          tokenBalance: { decrement: tournament.entryFee },
          totalTokensUsed: { increment: tournament.entryFee },
        },
      }),
      db.tournamentEntry.create({
        data: {
          tournamentId: id,
          userId: session.user.id,
        },
      }),
      // Record the transaction
      db.transaction.create({
        data: {
          userId: session.user.id,
          type: 'SPEND',
          amount: -tournament.entryFee,
          status: 'COMPLETED',
          metadata: {
            type: 'tournament_entry',
            tournamentId: id,
            tournamentName: tournament.name,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for tournament',
    });
  } catch (error) {
    console.error('Failed to register for tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register for tournament' },
      { status: 500 }
    );
  }
}
