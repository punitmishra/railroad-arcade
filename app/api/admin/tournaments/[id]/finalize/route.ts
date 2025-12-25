import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAccess } from '@/lib/admin';
import { queue } from '@/lib/queue';

// ============================================
// POST /api/admin/tournaments/[id]/finalize
// Force finalize an active tournament early
// ============================================

export async function POST(
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

    if (tournament.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: `Can only finalize active tournaments. Current status: ${tournament.status}`,
        },
        { status: 400 }
      );
    }

    // Queue finalization job
    await queue.finalizeTournament({ tournamentId: id });

    return NextResponse.json({
      success: true,
      message: 'Tournament finalization queued',
      tournamentId: id,
      participantCount: tournament._count.entries,
    });
  } catch (error) {
    console.error('Failed to finalize tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to finalize tournament' },
      { status: 500 }
    );
  }
}
