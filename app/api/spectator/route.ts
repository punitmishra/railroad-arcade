// ============================================
// Spectator Mode API
// ============================================
// Allows users to watch live sessions without queue.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getActiveSpectatorSession,
  joinAsSpectator,
  leaveSpectator,
  getSpectatorSession,
} from '@/lib/spectator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/spectator
 * Get current active session available for spectating
 */
export async function GET() {
  try {
    const session = await getActiveSpectatorSession();

    if (!session) {
      return NextResponse.json({
        active: false,
        message: 'No active session to spectate',
      });
    }

    return NextResponse.json({
      active: true,
      session: {
        sessionId: session.sessionId,
        controllerUsername: session.controllerUsername,
        spectatorCount: session.spectatorCount,
        startedAt: session.startedAt,
        isLive: session.isLive,
      },
    });
  } catch (error) {
    console.error('[Spectator] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get spectator session' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/spectator
 * Join or leave spectator mode
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, sessionId } = body;

    if (action === 'join') {
      if (!sessionId) {
        // Get active session if not specified
        const activeSession = await getActiveSpectatorSession();
        if (!activeSession) {
          return NextResponse.json(
            { error: 'No active session to spectate' },
            { status: 404 }
          );
        }
        const result = await joinAsSpectator(session.user.id, activeSession.sessionId);
        return NextResponse.json(result);
      }

      const result = await joinAsSpectator(session.user.id, sessionId);
      return NextResponse.json(result);
    }

    if (action === 'leave') {
      await leaveSpectator(session.user.id);
      return NextResponse.json({ success: true });
    }

    if (action === 'status') {
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
      }
      const spectatorSession = await getSpectatorSession(sessionId);
      return NextResponse.json({ session: spectatorSession });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Spectator] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process spectator request' },
      { status: 500 }
    );
  }
}
