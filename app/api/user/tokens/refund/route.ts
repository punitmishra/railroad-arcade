import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { userCache, apiRateLimit } from '@/lib/redis';

interface RefundRequest {
  transactionId: string;
  reason: string;
}

// POST /api/user/tokens/refund - Refund tokens from a previous transaction
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

    const body: RefundRequest = await request.json();
    const { transactionId, reason } = body;

    // Validate input
    if (!transactionId || typeof transactionId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Find the original transaction
      const originalTransaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        select: {
          id: true,
          userId: true,
          type: true,
          amount: true,
          status: true,
          metadata: true,
        },
      });

      if (!originalTransaction) {
        throw new Error('Transaction not found');
      }

      // Verify ownership
      if (originalTransaction.userId !== session.user.id) {
        throw new Error('Unauthorized');
      }

      // Only allow refund of SPEND transactions
      if (originalTransaction.type !== 'SPEND') {
        throw new Error('Only spend transactions can be refunded');
      }

      // Check if already refunded
      if (originalTransaction.status === 'REFUNDED') {
        throw new Error('Transaction already refunded');
      }

      // Check for existing refund transaction
      const existingRefund = await tx.transaction.findFirst({
        where: {
          userId: session.user.id,
          type: 'REFUND',
          metadata: {
            path: ['originalTransactionId'],
            equals: transactionId,
          },
        },
      });

      if (existingRefund) {
        throw new Error('Refund already processed');
      }

      // Calculate refund amount (negative amount becomes positive)
      const refundAmount = Math.abs(originalTransaction.amount);

      // Refund tokens to user
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          tokenBalance: { increment: refundAmount },
          totalTokensUsed: { decrement: refundAmount },
        },
        select: { tokenBalance: true },
      });

      // Mark original transaction as refunded
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'REFUNDED' },
      });

      // Create refund transaction record
      const refundTransaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'REFUND',
          amount: refundAmount,
          provider: 'SYSTEM',
          status: 'COMPLETED',
          metadata: {
            originalTransactionId: transactionId,
            reason,
            originalMetadata: originalTransaction.metadata,
          },
        },
        select: { id: true },
      });

      return {
        newBalance: updatedUser.tokenBalance,
        refundAmount,
        refundTransactionId: refundTransaction.id,
      };
    });

    // Invalidate user cache
    await userCache.invalidateBalance(session.user.id);
    await userCache.invalidateProfile(session.user.id);

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      refundAmount: result.refundAmount,
      refundTransactionId: result.refundTransactionId,
    });
  } catch (error) {
    console.error('Token refund error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to refund tokens';

    // Check for specific error types
    if (errorMessage === 'Transaction not found') {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 404 }
      );
    }

    if (errorMessage === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 403 }
      );
    }

    if (
      errorMessage.includes('already refunded') ||
      errorMessage.includes('already processed') ||
      errorMessage.includes('Only spend transactions')
    ) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to refund tokens' },
      { status: 500 }
    );
  }
}
