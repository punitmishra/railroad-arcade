// ============================================
// Session Recording API
// ============================================
// Manage session recordings (not video files).

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getRecording,
  listUserRecordings,
  startPlayback,
  getPlaybackState,
  stopPlayback,
  togglePlayback,
  setPlaybackSpeed,
} from '@/lib/session-recording';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recordings/session
 * Get a recording or list user's recordings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const playbackId = request.nextUrl.searchParams.get('playbackId');

    // Get playback state
    if (playbackId) {
      const state = getPlaybackState(playbackId);
      if (!state) {
        return NextResponse.json({ error: 'Playback not found' }, { status: 404 });
      }
      return NextResponse.json({
        playbackId,
        isPlaying: state.isPlaying,
        currentIndex: state.currentIndex,
        totalEvents: state.recording.events.length,
        playbackSpeed: state.playbackSpeed,
      });
    }

    // Get specific recording
    if (sessionId) {
      const recording = await getRecording(sessionId);
      if (!recording) {
        return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
      }

      // Verify ownership
      if (recording.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({ recording });
    }

    // List user's recordings
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const recordings = await listUserRecordings(session.user.id, limit);
    return NextResponse.json({ recordings });
  } catch (error) {
    console.error('[Recordings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get recording' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recordings/session
 * Start/control playback
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, sessionId, playbackId, speed } = body;

    switch (action) {
      case 'start': {
        if (!sessionId) {
          return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        }

        const recording = await getRecording(sessionId);
        if (!recording) {
          return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
        }

        if (recording.userId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const newPlaybackId = `playback_${Date.now()}_${session.user.id}`;
        const state = startPlayback(newPlaybackId, recording, speed || 1.0);

        return NextResponse.json({
          playbackId: newPlaybackId,
          isPlaying: state.isPlaying,
          totalEvents: recording.events.length,
          duration: recording.metadata.duration,
        });
      }

      case 'stop': {
        if (!playbackId) {
          return NextResponse.json({ error: 'playbackId required' }, { status: 400 });
        }
        stopPlayback(playbackId);
        return NextResponse.json({ success: true });
      }

      case 'toggle': {
        if (!playbackId) {
          return NextResponse.json({ error: 'playbackId required' }, { status: 400 });
        }
        const isPlaying = togglePlayback(playbackId);
        return NextResponse.json({ isPlaying });
      }

      case 'speed': {
        if (!playbackId || typeof speed !== 'number') {
          return NextResponse.json({ error: 'playbackId and speed required' }, { status: 400 });
        }
        setPlaybackSpeed(playbackId, speed);
        return NextResponse.json({ speed });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Recordings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to control playback' },
      { status: 500 }
    );
  }
}
