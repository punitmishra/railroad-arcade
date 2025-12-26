import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAccess } from '@/lib/admin';

// Admin endpoint to grant tokens to users
// Supports granting to all users or specific users by ID
// Protected by ADMIN_KEY environment variable or session-based admin auth
export async function POST(request: NextRequest) {
  try {
    // Check admin access (supports both API key and session-based auth)
    const adminId = await checkAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { amount = 100, userIds, reason } = body;

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0 || amount > 10000) {
      return NextResponse.json(
        { success: false, error: 'Amount must be between 1 and 10000' },
        { status: 400 }
      );
    }

    // Build the where clause
    const whereClause = userIds && Array.isArray(userIds) && userIds.length > 0
      ? { id: { in: userIds } }
      : {};

    // Use transaction for atomicity
    const result = await db.$transaction(async (tx) => {
      // Increment token balance for matching users
      const updateResult = await tx.user.updateMany({
        where: whereClause,
        data: {
          tokenBalance: { increment: amount },
        },
      });

      // Get affected users for transaction records
      const affectedUsers = await tx.user.findMany({
        where: whereClause,
        select: { id: true },
      });

      // Create bonus transaction records for audit trail
      if (affectedUsers.length > 0) {
        await tx.transaction.createMany({
          data: affectedUsers.map((user) => ({
            userId: user.id,
            type: 'BONUS' as const,
            amount: amount,
            provider: 'SYSTEM' as const,
            status: 'COMPLETED' as const,
            metadata: {
              grantedBy: adminId,
              reason: reason || 'Admin grant',
              grantedAt: new Date().toISOString(),
            },
          })),
        });
      }

      return {
        count: updateResult.count,
        userIds: affectedUsers.map((u) => u.id),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        usersUpdated: result.count,
        tokensGranted: amount,
        userIds: userIds ? result.userIds : undefined,
      },
    });
  } catch (error) {
    console.error('Grant tokens error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
