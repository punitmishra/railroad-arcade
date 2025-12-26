import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const createCheckpointSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  gameMode: z.enum(['FREE_PLAY', 'DELIVERY_MISSION', 'SPEED_RUN', 'SURVIVAL', 'TIME_ATTACK']),
  isLive: z.boolean().optional(),
  score: z.number().int().min(0).optional(),
  timeRemaining: z.number().int().min(0).optional(),
  timeElapsed: z.number().int().min(0).optional(),
  trainStates: z.record(z.string(), z.object({
    track: z.number(),
    position: z.number(),
    speed: z.number(),
    direction: z.enum(['forward', 'reverse']),
  })),
  junctionStates: z.record(z.string(), z.object({
    thrown: z.boolean(),
  })),
  crossingStates: z.record(z.string(), z.object({
    active: z.boolean(),
  })),
  objectives: z.any().optional(),
  metadata: z.any().optional(),
});

// GET /api/checkpoints - List user's checkpoints
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameMode = searchParams.get('gameMode');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const checkpoints = await db.gameCheckpoint.findMany({
      where: {
        userId: session.user.id,
        ...(gameMode && { gameMode: gameMode as 'FREE_PLAY' | 'DELIVERY_MISSION' | 'SPEED_RUN' | 'SURVIVAL' | 'TIME_ATTACK' }),
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 50),
      select: {
        id: true,
        name: true,
        gameMode: true,
        isLive: true,
        score: true,
        timeRemaining: true,
        timeElapsed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ checkpoints });
  } catch (error) {
    console.error('Failed to fetch checkpoints:', error);
    return NextResponse.json({ error: 'Failed to fetch checkpoints' }, { status: 500 });
  }
}

// POST /api/checkpoints - Create a new checkpoint
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createCheckpointSchema.parse(body);

    // Limit checkpoints per user per game mode (max 5)
    const existingCount = await db.gameCheckpoint.count({
      where: {
        userId: session.user.id,
        gameMode: data.gameMode,
      },
    });

    if (existingCount >= 5) {
      // Delete oldest checkpoint to make room
      const oldest = await db.gameCheckpoint.findFirst({
        where: {
          userId: session.user.id,
          gameMode: data.gameMode,
        },
        orderBy: { updatedAt: 'asc' },
      });

      if (oldest) {
        await db.gameCheckpoint.delete({ where: { id: oldest.id } });
      }
    }

    const checkpoint = await db.gameCheckpoint.create({
      data: {
        userId: session.user.id,
        name: data.name || `Checkpoint ${new Date().toLocaleTimeString()}`,
        gameMode: data.gameMode,
        isLive: data.isLive || false,
        score: data.score || 0,
        timeRemaining: data.timeRemaining,
        timeElapsed: data.timeElapsed || 0,
        trainStates: data.trainStates,
        junctionStates: data.junctionStates,
        crossingStates: data.crossingStates,
        objectives: data.objectives,
        metadata: data.metadata,
      },
    });

    return NextResponse.json({ checkpoint }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
    }
    console.error('Failed to create checkpoint:', error);
    return NextResponse.json({ error: 'Failed to create checkpoint' }, { status: 500 });
  }
}

// DELETE /api/checkpoints - Delete a checkpoint
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkpointId = searchParams.get('id');

    if (!checkpointId) {
      return NextResponse.json({ error: 'Checkpoint ID required' }, { status: 400 });
    }

    // Verify ownership
    const checkpoint = await db.gameCheckpoint.findFirst({
      where: {
        id: checkpointId,
        userId: session.user.id,
      },
    });

    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    await db.gameCheckpoint.delete({ where: { id: checkpointId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete checkpoint:', error);
    return NextResponse.json({ error: 'Failed to delete checkpoint' }, { status: 500 });
  }
}
