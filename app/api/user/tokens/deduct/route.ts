import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, Prisma } from '@/lib/db';
import { userCache, apiRateLimit } from '@/lib/redis';
import { getActionCost, ACTION_PRICING } from '@/lib/pricing';

interface DeductRequest {
  action: string;
  cost?: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

// POST /api/user/tokens/deduct - Deduct tokens for an action
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success: rateLimitOk } = await apiRateLimit.limit(ip);

    if (!rateLimitOk) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: DeductRequest = await request.json();
    const { action, cost: providedCost, sessionId, metadata } = body;

    // Validate action
    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    // Calculate cost - use provided cost if valid, otherwise lookup
    const expectedCost = getActionCost(action);
    const cost = typeof providedCost === 'number' && providedCost >= 0
      ? providedCost
      : expectedCost;

    // Validate cost matches expected (prevent tampering)
    if (action in ACTION_PRICING && cost !== expectedCost) {
      return NextResponse.json(
        { success: false, error: 'Invalid cost for action' },
        { status: 400 }
      );
    }

    // Free actions - no deduction needed
    if (cost === 0) {
      return NextResponse.json({
        success: true,
        newBalance: 0, // Will be fetched if needed
        cost: 0,
        transactionId: null,
      });
    }

    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Get current balance with lock
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { tokenBalance: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.tokenBalance < cost) {
        throw new Error(`Insufficient tokens. Need ${cost}, have ${user.tokenBalance}`);
      }

      // Deduct tokens
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          tokenBalance: { decrement: cost },
          totalTokensUsed: { increment: cost },
        },
        select: { tokenBalance: true },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'SPEND',
          amount: -cost,
          provider: 'SYSTEM',
          status: 'COMPLETED',
          metadata: {
            action,
            sessionId: sessionId || null,
            ...((metadata || {}) as Record<string, Prisma.InputJsonValue>),
          },
        },
        select: { id: true },
      });

      // If sessionId provided, create a token action record
      if (sessionId) {
        // Validate session exists and belongs to user
        const playSession = await tx.playSession.findFirst({
          where: {
            id: sessionId,
            userId: session.user.id,
            status: 'ACTIVE',
          },
        });

        if (playSession) {
          // Map action to ActionType enum
          const actionTypeMap: Record<string, string> = {
            TRAIN_START: 'TRAIN_START',
            TRAIN_STOP: 'TRAIN_STOP',
            JUNCTION_SWITCH: 'JUNCTION_SWITCH',
            CROSSING_TOGGLE: 'CROSSING_TOGGLE',
            SCENERY_CHANGE: 'SCENERY_CHANGE',
            TIME_EXTEND: 'TIME_EXTEND',
            CAMERA_SWITCH: 'CAMERA_SWITCH',
          };

          const actionType = actionTypeMap[action];
          if (actionType) {
            await tx.tokenAction.create({
              data: {
                sessionId,
                actionType: actionType as 'TRAIN_START' | 'TRAIN_STOP' | 'JUNCTION_SWITCH' | 'CROSSING_TOGGLE' | 'SCENERY_CHANGE' | 'TIME_EXTEND' | 'CAMERA_SWITCH',
                tokenCost: cost,
                metadata: metadata as Prisma.InputJsonValue || undefined,
              },
            });

            // Update session tokens spent
            await tx.playSession.update({
              where: { id: sessionId },
              data: { tokensSpent: { increment: cost } },
            });
          }
        }
      }

      return {
        newBalance: updatedUser.tokenBalance,
        transactionId: transaction.id,
      };
    });

    // Invalidate user cache
    await userCache.invalidateBalance(session.user.id);
    await userCache.invalidateProfile(session.user.id);

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      cost,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error('Token deduct error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to deduct tokens';

    // Check for specific error types
    if (errorMessage.includes('Insufficient tokens')) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 402 } // Payment Required
      );
    }

    if (errorMessage.includes('User not found')) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to deduct tokens' },
      { status: 500 }
    );
  }
}
