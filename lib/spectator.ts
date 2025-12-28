// ============================================
// Spectator Mode System
// ============================================
// Allows users to watch live sessions without
// joining the queue.

import { redis } from './redis';
import { realtimeEmitter, RealtimeEventType } from './realtime';

// ============================================
// Types
// ============================================

export interface SpectatorSession {
  sessionId: string;
  controllerId: string;
  controllerUsername: string;
  startedAt: number;
  spectatorCount: number;
  isLive: boolean;
}

export interface SpectatorState {
  spectatorId: string;
  watchingSessionId: string | null;
  joinedAt: number;
}

// ============================================
// Constants
// ============================================

const SPECTATOR_COUNT_KEY = 'spectator:count:';
const SPECTATOR_SESSION_KEY = 'spectator:session:';
const ACTIVE_SESSION_KEY = 'spectator:active';
const SPECTATOR_TTL = 3600; // 1 hour

// Track spectators in memory for real-time updates
const spectatorRegistry = new Map<string, SpectatorState>();

// ============================================
// Session Management
// ============================================

/**
 * Start a spectatable session
 */
export async function startSpectatableSession(
  sessionId: string,
  controllerId: string,
  controllerUsername: string
): Promise<void> {
  const session: SpectatorSession = {
    sessionId,
    controllerId,
    controllerUsername,
    startedAt: Date.now(),
    spectatorCount: 0,
    isLive: true,
  };

  await redis.set(
    `${SPECTATOR_SESSION_KEY}${sessionId}`,
    session,
    { ex: SPECTATOR_TTL }
  );

  // Set as active session
  await redis.set(ACTIVE_SESSION_KEY, sessionId, { ex: SPECTATOR_TTL });

  // Emit spectator event
  emitSpectatorUpdate(session);
}

/**
 * End a spectatable session
 */
export async function endSpectatableSession(sessionId: string): Promise<void> {
  const key = `${SPECTATOR_SESSION_KEY}${sessionId}`;
  const session = await redis.get<SpectatorSession>(key);

  if (session) {
    session.isLive = false;
    await redis.set(key, session, { ex: 300 }); // Keep for 5 mins after end
  }

  // Clear active session if it matches
  const activeSession = await redis.get<string>(ACTIVE_SESSION_KEY);
  if (activeSession === sessionId) {
    await redis.del(ACTIVE_SESSION_KEY);
  }

  // Notify spectators session ended
  if (session) {
    emitSpectatorUpdate(session);
  }
}

/**
 * Get current active session for spectating
 */
export async function getActiveSpectatorSession(): Promise<SpectatorSession | null> {
  const sessionId = await redis.get<string>(ACTIVE_SESSION_KEY);
  if (!sessionId) {
    return null;
  }

  return getSpectatorSession(sessionId);
}

/**
 * Get spectator session by ID
 */
export async function getSpectatorSession(
  sessionId: string
): Promise<SpectatorSession | null> {
  return redis.get<SpectatorSession>(`${SPECTATOR_SESSION_KEY}${sessionId}`);
}

// ============================================
// Spectator Management
// ============================================

/**
 * Join as a spectator
 */
export async function joinAsSpectator(
  spectatorId: string,
  sessionId: string
): Promise<{ success: boolean; session?: SpectatorSession; error?: string }> {
  const session = await getSpectatorSession(sessionId);

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  if (!session.isLive) {
    return { success: false, error: 'Session has ended' };
  }

  // Register spectator
  const state: SpectatorState = {
    spectatorId,
    watchingSessionId: sessionId,
    joinedAt: Date.now(),
  };

  spectatorRegistry.set(spectatorId, state);

  // Increment spectator count
  const countKey = `${SPECTATOR_COUNT_KEY}${sessionId}`;
  const newCount = await redis.incr(countKey);
  await redis.expire(countKey, SPECTATOR_TTL);

  // Update session count
  session.spectatorCount = newCount;
  await redis.set(`${SPECTATOR_SESSION_KEY}${sessionId}`, session, {
    ex: SPECTATOR_TTL,
  });

  // Emit update
  emitSpectatorUpdate(session);

  return { success: true, session };
}

/**
 * Leave spectator mode
 */
export async function leaveSpectator(spectatorId: string): Promise<void> {
  const state = spectatorRegistry.get(spectatorId);
  if (!state || !state.watchingSessionId) {
    return;
  }

  const sessionId = state.watchingSessionId;
  spectatorRegistry.delete(spectatorId);

  // Decrement spectator count
  const countKey = `${SPECTATOR_COUNT_KEY}${sessionId}`;
  const newCount = Math.max(0, await redis.decr(countKey));

  // Update session
  const session = await getSpectatorSession(sessionId);
  if (session) {
    session.spectatorCount = newCount;
    await redis.set(`${SPECTATOR_SESSION_KEY}${sessionId}`, session, {
      ex: SPECTATOR_TTL,
    });
    emitSpectatorUpdate(session);
  }
}

/**
 * Get spectator count for a session
 */
export async function getSpectatorCount(sessionId: string): Promise<number> {
  const count = await redis.get<number>(`${SPECTATOR_COUNT_KEY}${sessionId}`);
  return count ?? 0;
}

/**
 * Check if user is spectating
 */
export function isSpectating(spectatorId: string): boolean {
  const state = spectatorRegistry.get(spectatorId);
  return state?.watchingSessionId !== null;
}

/**
 * Get spectator state
 */
export function getSpectatorState(spectatorId: string): SpectatorState | null {
  return spectatorRegistry.get(spectatorId) || null;
}

// ============================================
// Event Emission
// ============================================

export interface SpectatorUpdateData {
  sessionId: string;
  controllerId: string;
  controllerUsername: string;
  spectatorCount: number;
  isLive: boolean;
}

function emitSpectatorUpdate(session: SpectatorSession): void {
  const data: SpectatorUpdateData = {
    sessionId: session.sessionId,
    controllerId: session.controllerId,
    controllerUsername: session.controllerUsername,
    spectatorCount: session.spectatorCount,
    isLive: session.isLive,
  };

  realtimeEmitter.emit('system_status' as RealtimeEventType, {
    type: 'spectator_update',
    ...data,
  });
}

// ============================================
// Cleanup
// ============================================

/**
 * Cleanup stale spectator entries (run periodically)
 */
export function cleanupStaleSpectators(): void {
  const now = Date.now();
  const staleTimeout = 30 * 60 * 1000; // 30 minutes

  spectatorRegistry.forEach((state, spectatorId) => {
    if (now - state.joinedAt > staleTimeout) {
      leaveSpectator(spectatorId);
    }
  });
}
