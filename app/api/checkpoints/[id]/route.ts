import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/checkpoints/[id] - Get full checkpoint data for loading
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const checkpoint = await db.gameCheckpoint.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    return NextResponse.json({ checkpoint });
  } catch (error) {
    console.error('Failed to fetch checkpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch checkpoint' }, { status: 500 });
  }
}

// PATCH /api/checkpoints/[id] - Update checkpoint (overwrite save)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await db.gameCheckpoint.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    const checkpoint = await db.gameCheckpoint.update({
      where: { id },
      data: {
        name: body.name,
        score: body.score,
        timeRemaining: body.timeRemaining,
        timeElapsed: body.timeElapsed,
        trainStates: body.trainStates,
        junctionStates: body.junctionStates,
        crossingStates: body.crossingStates,
        objectives: body.objectives,
        metadata: body.metadata,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ checkpoint });
  } catch (error) {
    console.error('Failed to update checkpoint:', error);
    return NextResponse.json({ error: 'Failed to update checkpoint' }, { status: 500 });
  }
}
