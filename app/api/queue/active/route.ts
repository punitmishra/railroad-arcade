import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiRateLimit } from '@/lib/redis';
import {
  hasActiveControl,
  getRemainingControlTime,
  extendSession,
} from '@/lib/queue-manager';

// ============================================
// GET /api/queue/active - Check if user has active control
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = await apiRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Check authentication - return hasActiveSession: false for unauthenticated users
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        hasActiveSession: false,
        data: {
          hasControl: false,
          remainingSeconds: 0,
        },
      });
    }

    const isActive = await hasActiveControl(session.user.id);
    const remainingTime = isActive
      ? await getRemainingControlTime(session.user.id)
      : 0;

    return NextResponse.json({
      success: true,
      hasActiveSession: isActive,
      data: {
        hasControl: isActive,
        remainingSeconds: remainingTime,
      },
    });
  } catch (error) {
    console.error('Queue active GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/queue/active - Extend current session
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success: rateLimitSuccess } = await apiRateLimit.limit(ip);
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { extendPackageId } = body;

    if (!extendPackageId) {
      return NextResponse.json(
        { error: 'Extend package ID required' },
        { status: 400 }
      );
    }

    const result = await extendSession(session.user.id, extendPackageId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newEndTime: result.newEndTime,
        remainingSeconds: result.newEndTime
          ? Math.round((result.newEndTime.getTime() - Date.now()) / 1000)
          : 0,
      },
    });
  } catch (error) {
    console.error('Queue active POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
