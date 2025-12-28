// ============================================
// Session Heartbeat API
// ============================================
// Lightweight endpoint for session keep-alive.
// Called frequently (every 10-30 seconds) by clients.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { hasActiveControl, getRemainingControlTime } from '@/lib/queue-manager';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        shouldReconnect: true,
      }, { status: 401 });
    }

    const userId = session.user.id;

    // Quick check for active control
    const hasControl = await hasActiveControl(userId);

    if (!hasControl) {
      return NextResponse.json({
        success: false,
        error: 'No active session',
        hasSession: false,
        shouldReconnect: false,
      }, { status: 400 });
    }

    // Get session ID from cache
    const sessionId = await redis.get<string>(`user:${userId}:activeSession`);

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session not found in cache',
        hasSession: false,
        shouldReconnect: false,
      }, { status: 400 });
    }

    // Update heartbeat timestamp
    const now = Date.now();
    await redis.set(`session:${sessionId}:last_heartbeat`, now, { ex: 3600 });

    // Get remaining time
    const remainingSeconds = await getRemainingControlTime(userId);

    // Check if session is about to expire
    const isExpiringSoon = remainingSeconds <= 60;

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        remainingSeconds,
        lastHeartbeat: now,
        isExpiringSoon,
        // Suggest next heartbeat interval
        nextHeartbeatMs: isExpiringSoon ? 5000 : 15000,
      },
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        shouldReconnect: true,
      },
      { status: 500 }
    );
  }
}

// GET method for simple health check
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        hasSession: false,
        authenticated: false,
      });
    }

    const userId = session.user.id;
    const hasControl = await hasActiveControl(userId);
    const remainingSeconds = hasControl ? await getRemainingControlTime(userId) : 0;

    return NextResponse.json({
      hasSession: hasControl,
      authenticated: true,
      remainingSeconds,
    });
  } catch (error) {
    return NextResponse.json({
      hasSession: false,
      authenticated: false,
      error: 'Check failed',
    });
  }
}
