import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { userCache } from '@/lib/redis';

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

    const userId = session.user.id;

    // Get tournament for initial validation (non-atomic checks)
    const tournament = await db.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if registration is open (time-based, safe to check outside transaction)
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

    // Check tournament status
    if (tournament.status !== 'REGISTRATION' && tournament.status !== 'SCHEDULED') {
      return NextResponse.json(
        { success: false, error: 'Tournament is not accepting registrations' },
        { status: 400 }
      );
    }

    // Use interactive transaction to prevent race conditions
    // All capacity checks and mutations happen atomically
    const result = await db.$transaction(async (tx) => {
      // Re-fetch tournament with entry count inside transaction for atomic check
      const tournamentWithCount = await tx.tournament.findUnique({
        where: { id },
        include: {
          _count: { select: { entries: true } },
        },
      });

      if (!tournamentWithCount) {
        return { error: 'Tournament not found', status: 404 };
      }

      // Atomic capacity check
      if (tournamentWithCount._count.entries >= tournamentWithCount.maxParticipants) {
        return { error: 'Tournament is full', status: 400 };
      }

      // Check if user is already registered (inside transaction)
      const existingEntry = await tx.tournamentEntry.findUnique({
        where: {
          tournamentId_userId: {
            tournamentId: id,
            userId,
          },
        },
      });

      if (existingEntry) {
        return { error: 'Already registered', status: 400 };
      }

      // Get user's token balance and level
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { tokenBalance: true, totalSessions: true },
      });

      if (!user) {
        return { error: 'User not found', status: 404 };
      }

      // Check level requirement
      if (tournamentWithCount.minLevel > 1) {
        const userLevel = calculateUserLevel(user.totalSessions);
        if (userLevel < tournamentWithCount.minLevel) {
          return {
            error: `Requires level ${tournamentWithCount.minLevel}. You are level ${userLevel}.`,
            status: 400,
            currentLevel: userLevel,
            requiredLevel: tournamentWithCount.minLevel,
          };
        }
      }

      // Check token balance
      if (user.tokenBalance < tournamentWithCount.entryFee) {
        return { error: 'Insufficient tokens', status: 400 };
      }

      // All checks passed - perform atomic registration
      // Deduct entry fee
      await tx.user.update({
        where: { id: userId },
        data: {
          tokenBalance: { decrement: tournamentWithCount.entryFee },
          totalTokensUsed: { increment: tournamentWithCount.entryFee },
        },
      });

      // Create tournament entry
      await tx.tournamentEntry.create({
        data: {
          tournamentId: id,
          userId,
        },
      });

      // Record the transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'SPEND',
          amount: -tournamentWithCount.entryFee,
          status: 'COMPLETED',
          metadata: {
            type: 'tournament_entry',
            tournamentId: id,
            tournamentName: tournamentWithCount.name,
          },
        },
      });

      return { success: true };
    });

    // Handle transaction result
    if ('error' in result) {
      const response: Record<string, unknown> = {
        success: false,
        error: result.error,
      };
      if ('currentLevel' in result) {
        response.currentLevel = result.currentLevel;
        response.requiredLevel = result.requiredLevel;
      }
      return NextResponse.json(response, { status: result.status });
    }

    // Invalidate user cache after successful registration
    await userCache.invalidateBalance(userId);

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
