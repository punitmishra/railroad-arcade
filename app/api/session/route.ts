// ============================================
// Session Management API
// ============================================
// Manages active hardware control sessions.
// Coordinates between cloud (Next.js) and edge (Rust).

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { redis, playSessionCache } from '@/lib/redis';
import {
  hasActiveControl,
  getRemainingControlTime,
  tryActivateNextUser,
} from '@/lib/queue-manager';
import { emitSessionUpdate } from '@/lib/realtime';

// ============================================
// Types
// ============================================

interface SessionInfo {
  sessionId: string;
  userId: string;
  status: 'ACTIVE' | 'ENDED';
  startedAt: string;
  endsAt: string;
  remainingSeconds: number;
  hardwareNotified: boolean;
}

// ============================================
// GET /api/session - Get current session info
// ============================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const userId = session.user.id;

    // Check for active queue entry
    const queueEntry = await db.liveQueue.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (!queueEntry) {
      return NextResponse.json({
        success: true,
        data: {
          hasSession: false,
        },
      });
    }

    // Check if session is still valid
    const now = new Date();
    if (queueEntry.controlEndsAt && queueEntry.controlEndsAt < now) {
      // Session expired, clean up
      await db.liveQueue.update({
        where: { id: queueEntry.id },
        data: { status: 'COMPLETED' },
      });

      await playSessionCache.clearUserActiveSession(userId);
      await tryActivateNextUser();

      return NextResponse.json({
        success: true,
        data: {
          hasSession: false,
          expired: true,
        },
      });
    }

    const remainingSeconds = queueEntry.controlEndsAt
      ? Math.max(0, Math.floor((queueEntry.controlEndsAt.getTime() - now.getTime()) / 1000))
      : 0;

    // Check if hardware was notified (stored in Redis)
    const hardwareNotified = await redis.get<boolean>(`session:${queueEntry.id}:hardware_notified`) ?? false;

    const sessionInfo: SessionInfo = {
      sessionId: queueEntry.id,
      userId: queueEntry.userId,
      status: 'ACTIVE',
      startedAt: queueEntry.controlStarted?.toISOString() ?? now.toISOString(),
      endsAt: queueEntry.controlEndsAt?.toISOString() ?? now.toISOString(),
      remainingSeconds,
      hardwareNotified,
    };

    return NextResponse.json({
      success: true,
      data: {
        hasSession: true,
        session: sessionInfo,
      },
    });
  } catch (error) {
    console.error('Session GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/session - Session actions
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        return handleSessionStart(userId);

      case 'end':
        return handleSessionEnd(userId);

      case 'heartbeat':
        return handleHeartbeat(userId);

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start, end, or heartbeat',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Session POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// Session Start Handler
// ============================================

async function handleSessionStart(userId: string) {
  // Check if user has active control
  const hasControl = await hasActiveControl(userId);

  if (!hasControl) {
    return NextResponse.json({
      success: false,
      error: 'No active session. Join the queue first.',
    }, { status: 400 });
  }

  // Get session info
  const queueEntry = await db.liveQueue.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (!queueEntry) {
    return NextResponse.json({
      success: false,
      error: 'Session not found',
    }, { status: 404 });
  }

  // Notify Rust backend about session start
  const hardwareNotified = await notifyHardwareSessionStart(queueEntry.id, userId);

  // Store notification status
  if (hardwareNotified) {
    await redis.set(`session:${queueEntry.id}:hardware_notified`, true, { ex: 3600 });
  }

  // Set last heartbeat
  await redis.set(`session:${queueEntry.id}:last_heartbeat`, Date.now(), { ex: 3600 });

  const remainingSeconds = await getRemainingControlTime(userId);

  // Emit session start event
  emitSessionUpdate({
    sessionId: queueEntry.id,
    status: 'started',
    remainingTime: remainingSeconds,
  });

  return NextResponse.json({
    success: true,
    data: {
      sessionId: queueEntry.id,
      remainingSeconds,
      hardwareNotified,
    },
  });
}

// ============================================
// Session End Handler
// ============================================

async function handleSessionEnd(userId: string) {
  // Get session info
  const queueEntry = await db.liveQueue.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (!queueEntry) {
    return NextResponse.json({
      success: false,
      error: 'No active session',
    }, { status: 400 });
  }

  // Notify Rust backend about session end
  await notifyHardwareSessionEnd(queueEntry.id, userId);

  // Mark session as completed
  await db.liveQueue.update({
    where: { id: queueEntry.id },
    data: { status: 'COMPLETED' },
  });

  // Clear caches
  await playSessionCache.clearUserActiveSession(userId);
  await redis.del(`session:${queueEntry.id}:hardware_notified`);
  await redis.del(`session:${queueEntry.id}:last_heartbeat`);
  await redis.del('live:queue:state');

  // Emit session end event
  emitSessionUpdate({
    sessionId: queueEntry.id,
    status: 'ended',
    remainingTime: 0,
  });

  // Activate next user in queue
  await tryActivateNextUser();

  return NextResponse.json({
    success: true,
    data: {
      sessionId: queueEntry.id,
      status: 'ended',
    },
  });
}

// ============================================
// Heartbeat Handler
// ============================================

async function handleHeartbeat(userId: string) {
  // Check if user has active control
  const hasControl = await hasActiveControl(userId);

  if (!hasControl) {
    return NextResponse.json({
      success: false,
      error: 'No active session',
    }, { status: 400 });
  }

  // Get session info
  const queueEntry = await db.liveQueue.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (!queueEntry) {
    return NextResponse.json({
      success: false,
      error: 'Session not found',
    }, { status: 404 });
  }

  // Update last heartbeat
  const now = Date.now();
  await redis.set(`session:${queueEntry.id}:last_heartbeat`, now, { ex: 3600 });

  const remainingSeconds = await getRemainingControlTime(userId);

  return NextResponse.json({
    success: true,
    data: {
      sessionId: queueEntry.id,
      remainingSeconds,
      lastHeartbeat: now,
    },
  });
}

// ============================================
// Hardware Notification Helpers
// ============================================

async function notifyHardwareSessionStart(sessionId: string, userId: string): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    console.warn('Hardware API URL not configured, skipping notification');
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${apiUrl}/api/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('Failed to notify hardware of session start:', response.status);
      return false;
    }

    console.log('Hardware notified of session start:', sessionId);
    return true;
  } catch (error) {
    console.error('Error notifying hardware of session start:', error);
    return false;
  }
}

async function notifyHardwareSessionEnd(sessionId: string, userId: string): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    console.warn('Hardware API URL not configured, skipping notification');
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${apiUrl}/api/session/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('Failed to notify hardware of session end:', response.status);
      return false;
    }

    console.log('Hardware notified of session end:', sessionId);
    return true;
  } catch (error) {
    console.error('Error notifying hardware of session end:', error);
    return false;
  }
}
