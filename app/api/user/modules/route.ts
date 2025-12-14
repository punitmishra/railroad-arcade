import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { userCache } from '@/lib/redis';
import { MODULE_COSTS, DEFAULT_UNLOCKED_MODULES } from '@/lib/pricing';

// POST /api/user/modules - Unlock a module
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, cost } = body;

    // Validate module ID
    if (!moduleId || typeof moduleId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    // Verify the cost matches our pricing
    const expectedCost = MODULE_COSTS[moduleId];
    if (expectedCost === undefined) {
      return NextResponse.json(
        { error: 'Unknown module' },
        { status: 400 }
      );
    }

    if (cost !== expectedCost) {
      return NextResponse.json(
        { error: 'Invalid cost for module' },
        { status: 400 }
      );
    }

    // Get current user state
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        tokenBalance: true,
        unlockedModules: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already unlocked
    if (user.unlockedModules.includes(moduleId)) {
      return NextResponse.json(
        { error: 'Module already unlocked' },
        { status: 400 }
      );
    }

    // Check sufficient balance (if cost > 0)
    if (cost > 0 && user.tokenBalance < cost) {
      return NextResponse.json(
        { error: 'Insufficient token balance' },
        { status: 400 }
      );
    }

    // Atomically update user and create transaction
    const [updatedUser] = await db.$transaction([
      // Update user: deduct tokens and add module
      db.user.update({
        where: { id: session.user.id },
        data: {
          tokenBalance: { decrement: cost },
          totalTokensUsed: { increment: cost },
          unlockedModules: { push: moduleId },
        },
        select: {
          tokenBalance: true,
          unlockedModules: true,
        },
      }),
      // Create transaction record (only if cost > 0)
      ...(cost > 0
        ? [
            db.transaction.create({
              data: {
                userId: session.user.id,
                type: 'SPEND',
                amount: -cost,
                status: 'COMPLETED',
                metadata: {
                  reason: 'module_unlock',
                  moduleId,
                },
              },
            }),
          ]
        : []),
    ]);

    // Invalidate cache
    try {
      await userCache.invalidateBalance(session.user.id);
      await userCache.invalidateProfile(session.user.id);
    } catch (cacheError) {
      console.warn('Cache invalidation failed:', cacheError);
    }

    return NextResponse.json({
      success: true,
      moduleId,
      unlockedModules: updatedUser.unlockedModules,
      tokenBalance: updatedUser.tokenBalance,
    });
  } catch (error) {
    console.error('Unlock module error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock module' },
      { status: 500 }
    );
  }
}

// GET /api/user/modules - Get unlocked modules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Return default modules for unauthenticated users
      return NextResponse.json({
        unlockedModules: DEFAULT_UNLOCKED_MODULES,
        isAuthenticated: false,
      });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        unlockedModules: true,
      },
    });

    return NextResponse.json({
      unlockedModules: user?.unlockedModules ?? DEFAULT_UNLOCKED_MODULES,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('Get modules error:', error);
    return NextResponse.json(
      { error: 'Failed to get modules' },
      { status: 500 }
    );
  }
}
