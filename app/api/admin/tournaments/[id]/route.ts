import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAccess } from '@/lib/admin';
import { userCache } from '@/lib/redis';
import { emitTournamentUpdate } from '@/lib/realtime';

// ============================================
// Admin Tournament Management Endpoints
// ============================================

// PATCH /api/admin/tournaments/[id] - Update tournament
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin access
    const adminId = await checkAdminAccess(request);
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
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

    // Prevent modifying completed/cancelled tournaments
    if (['COMPLETED', 'CANCELLED'].includes(tournament.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify finished tournaments' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      registrationEnd,
      endTime,
      maxParticipants,
      prizePool,
      prizes,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (registrationEnd) updateData.registrationEnd = new Date(registrationEnd);
    if (endTime) updateData.endTime = new Date(endTime);
    if (maxParticipants) updateData.maxParticipants = maxParticipants;
    if (prizePool !== undefined) updateData.prizePool = prizePool;
    if (prizes) updateData.prizes = prizes;

    // Update tournament
    const updated = await db.tournament.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      tournament: updated,
    });
  } catch (error) {
    console.error('Failed to update tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tournament' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tournaments/[id] - Cancel tournament (with refunds)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin access
    const adminId = await checkAdminAccess(request);
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get tournament with entries
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: { entries: true },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel completed tournament' },
        { status: 400 }
      );
    }

    if (tournament.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Tournament already cancelled' },
        { status: 400 }
      );
    }

    // Refund entry fees to all participants
    await db.$transaction(async (tx) => {
      for (const entry of tournament.entries) {
        if (tournament.entryFee > 0) {
          // Refund tokens
          await tx.user.update({
            where: { id: entry.userId },
            data: { tokenBalance: { increment: tournament.entryFee } },
          });

          // Record refund transaction
          await tx.transaction.create({
            data: {
              userId: entry.userId,
              type: 'REFUND',
              amount: tournament.entryFee,
              status: 'COMPLETED',
              metadata: {
                type: 'tournament_cancellation',
                tournamentId: id,
                tournamentName: tournament.name,
              },
            },
          });

          // Invalidate user cache
          await userCache.invalidateBalance(entry.userId);
        }
      }

      // Mark tournament as cancelled
      await tx.tournament.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });

    // Emit status update
    emitTournamentUpdate({
      tournamentId: id,
      status: 'CANCELLED',
    });

    return NextResponse.json({
      success: true,
      message: 'Tournament cancelled',
      refundsIssued: tournament.entries.length,
      totalRefunded: tournament.entries.length * tournament.entryFee,
    });
  } catch (error) {
    console.error('Failed to cancel tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel tournament' },
      { status: 500 }
    );
  }
}
