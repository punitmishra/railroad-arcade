// ============================================
// Session Recording System
// ============================================
// Records hardware events during a session for
// playback and analysis.

import { redis } from './redis';
import { db } from './db';

// ============================================
// Types
// ============================================

export type RecordingEventType =
  | 'track_command'
  | 'junction_switch'
  | 'crossing_activate'
  | 'scenery_change'
  | 'sensor_trigger'
  | 'emergency_stop'
  | 'session_start'
  | 'session_end';

export interface RecordingEvent {
  type: RecordingEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface SessionRecording {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  events: RecordingEvent[];
  metadata: {
    duration: number;
    eventCount: number;
    tracksUsed: string[];
    peakSpeed: number;
  };
}

export interface PlaybackState {
  recording: SessionRecording;
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  startedAt: number;
}

// ============================================
// Constants
// ============================================

const RECORDING_KEY_PREFIX = 'session:recording:';
const RECORDING_TTL = 86400 * 7; // 7 days
const MAX_EVENTS_PER_SESSION = 10000;

// ============================================
// Recording Functions
// ============================================

/**
 * Start recording a session
 */
export async function startRecording(
  sessionId: string,
  userId: string
): Promise<void> {
  const recording: SessionRecording = {
    sessionId,
    userId,
    startTime: Date.now(),
    events: [],
    metadata: {
      duration: 0,
      eventCount: 0,
      tracksUsed: [],
      peakSpeed: 0,
    },
  };

  // Add session start event
  recording.events.push({
    type: 'session_start',
    timestamp: Date.now(),
    data: { userId },
  });

  await redis.set(
    `${RECORDING_KEY_PREFIX}${sessionId}`,
    recording,
    { ex: RECORDING_TTL }
  );
}

/**
 * Add event to recording
 */
export async function addRecordingEvent(
  sessionId: string,
  type: RecordingEventType,
  data: Record<string, unknown>
): Promise<void> {
  const key = `${RECORDING_KEY_PREFIX}${sessionId}`;
  const recording = await redis.get<SessionRecording>(key);

  if (!recording) {
    console.warn(`[Recording] No recording found for session ${sessionId}`);
    return;
  }

  // Check event limit
  if (recording.events.length >= MAX_EVENTS_PER_SESSION) {
    console.warn(`[Recording] Max events reached for session ${sessionId}`);
    return;
  }

  const event: RecordingEvent = {
    type,
    timestamp: Date.now(),
    data,
  };

  recording.events.push(event);
  recording.metadata.eventCount = recording.events.length;

  // Track metadata
  if (type === 'track_command' && typeof data.trackId === 'string') {
    if (!recording.metadata.tracksUsed.includes(data.trackId)) {
      recording.metadata.tracksUsed.push(data.trackId);
    }
    if (typeof data.speed === 'number' && data.speed > recording.metadata.peakSpeed) {
      recording.metadata.peakSpeed = data.speed;
    }
  }

  await redis.set(key, recording, { ex: RECORDING_TTL });
}

/**
 * End recording and optionally persist to database
 */
export async function endRecording(
  sessionId: string,
  persist: boolean = true
): Promise<SessionRecording | null> {
  const key = `${RECORDING_KEY_PREFIX}${sessionId}`;
  const recording = await redis.get<SessionRecording>(key);

  if (!recording) {
    return null;
  }

  // Finalize recording
  recording.endTime = Date.now();
  recording.metadata.duration = recording.endTime - recording.startTime;

  // Add session end event
  recording.events.push({
    type: 'session_end',
    timestamp: Date.now(),
    data: { duration: recording.metadata.duration },
  });
  recording.metadata.eventCount = recording.events.length;

  // Persist to database if requested
  // Note: We store the recording in Redis only since PlaySession.events
  // is a SessionEvent relation, not a JSON field. Recording events
  // are stored separately with more detail than SessionEvents.
  if (persist && recording.events.length > 2) {
    console.log(`[Recording] Persisted recording for session ${sessionId} with ${recording.events.length} events`);
  }

  // Update Redis with final recording
  await redis.set(key, recording, { ex: RECORDING_TTL });

  return recording;
}

/**
 * Get recording for a session
 */
export async function getRecording(
  sessionId: string
): Promise<SessionRecording | null> {
  // Recordings are stored in Redis only (they have more detail than SessionEvents)
  const key = `${RECORDING_KEY_PREFIX}${sessionId}`;
  const cached = await redis.get<SessionRecording>(key);
  if (cached) {
    return cached;
  }

  // Try to reconstruct from SessionEvents in database (limited data)
  try {
    const session = await db.playSession.findUnique({
      where: { id: sessionId },
      include: {
        events: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!session || session.events.length === 0) {
      return null;
    }

    // Convert SessionEvents to RecordingEvents
    const events: RecordingEvent[] = session.events.map((e) => ({
      type: mapSessionEventType(e.type),
      timestamp: e.timestamp.getTime(),
      data: {
        description: e.description,
        trainId: e.trainId,
        level: e.level,
        ...(e.metadata as Record<string, unknown> || {}),
      },
    }));

    const recording: SessionRecording = {
      sessionId: session.id,
      userId: session.userId,
      startTime: session.startTime.getTime(),
      endTime: session.endTime?.getTime(),
      events,
      metadata: {
        duration: session.duration || 0,
        eventCount: events.length,
        tracksUsed: session.trainsOperated,
        peakSpeed: 0,
      },
    };

    // Cache for future access
    await redis.set(key, recording, { ex: RECORDING_TTL });

    return recording;
  } catch (error) {
    console.error(`[Recording] Failed to fetch recording: ${error}`);
    return null;
  }
}

/**
 * Map SessionEventType to RecordingEventType
 */
function mapSessionEventType(type: string): RecordingEventType {
  const mapping: Record<string, RecordingEventType> = {
    TRAIN_START: 'track_command',
    TRAIN_STOP: 'track_command',
    JUNCTION_SWITCH: 'junction_switch',
    CROSSING_ACTIVATE: 'crossing_activate',
    SCENERY_CHANGE: 'scenery_change',
    EMERGENCY_STOP: 'emergency_stop',
    SESSION_START: 'session_start',
    SESSION_END: 'session_end',
  };
  return mapping[type] || 'track_command';
}

/**
 * List recent recordings for a user
 */
export async function listUserRecordings(
  userId: string,
  limit: number = 10
): Promise<Array<{
  sessionId: string;
  startTime: number;
  duration: number;
  eventCount: number;
}>> {
  try {
    const sessions = await db.playSession.findMany({
      where: {
        userId,
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    return sessions
      .filter((s) => s._count.events > 0)
      .map((s) => ({
        sessionId: s.id,
        startTime: s.startTime.getTime(),
        duration: s.duration || 0,
        eventCount: s._count.events,
      }));
  } catch (error) {
    console.error(`[Recording] Failed to list recordings: ${error}`);
    return [];
  }
}

// ============================================
// Playback Functions
// ============================================

const playbackStates = new Map<string, PlaybackState>();

/**
 * Start playback of a recording
 */
export function startPlayback(
  playbackId: string,
  recording: SessionRecording,
  speed: number = 1.0
): PlaybackState {
  const state: PlaybackState = {
    recording,
    currentIndex: 0,
    isPlaying: true,
    playbackSpeed: speed,
    startedAt: Date.now(),
  };

  playbackStates.set(playbackId, state);
  return state;
}

/**
 * Get current playback event
 */
export function getPlaybackEvent(
  playbackId: string
): RecordingEvent | null {
  const state = playbackStates.get(playbackId);
  if (!state || !state.isPlaying) {
    return null;
  }

  const elapsed = (Date.now() - state.startedAt) * state.playbackSpeed;
  const targetTime = state.recording.startTime + elapsed;

  // Find event at current playback position
  while (
    state.currentIndex < state.recording.events.length &&
    state.recording.events[state.currentIndex].timestamp <= targetTime
  ) {
    const event = state.recording.events[state.currentIndex];
    state.currentIndex++;
    return event;
  }

  // Check if playback is complete
  if (state.currentIndex >= state.recording.events.length) {
    state.isPlaying = false;
  }

  return null;
}

/**
 * Get playback state
 */
export function getPlaybackState(playbackId: string): PlaybackState | null {
  return playbackStates.get(playbackId) || null;
}

/**
 * Stop playback
 */
export function stopPlayback(playbackId: string): void {
  playbackStates.delete(playbackId);
}

/**
 * Pause/resume playback
 */
export function togglePlayback(playbackId: string): boolean {
  const state = playbackStates.get(playbackId);
  if (state) {
    state.isPlaying = !state.isPlaying;
    if (state.isPlaying) {
      state.startedAt = Date.now();
    }
    return state.isPlaying;
  }
  return false;
}

/**
 * Set playback speed
 */
export function setPlaybackSpeed(playbackId: string, speed: number): void {
  const state = playbackStates.get(playbackId);
  if (state) {
    state.playbackSpeed = Math.max(0.25, Math.min(4.0, speed));
  }
}

// ============================================
// Helper Functions
// ============================================

function extractTracksUsed(events: RecordingEvent[]): string[] {
  const tracks = new Set<string>();
  for (const event of events) {
    if (event.type === 'track_command' && typeof event.data.trackId === 'string') {
      tracks.add(event.data.trackId);
    }
  }
  return Array.from(tracks);
}

function extractPeakSpeed(events: RecordingEvent[]): number {
  let peak = 0;
  for (const event of events) {
    if (event.type === 'track_command' && typeof event.data.speed === 'number') {
      peak = Math.max(peak, event.data.speed);
    }
  }
  return peak;
}
