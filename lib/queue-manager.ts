// ============================================
// Queue Manager for Live Hardware Access
// ============================================
// Manages fair queue-based access to the live
// railroad hardware.

import { db, QueueStatus } from './db';
import { redis, playSessionCache } from './redis';
import { getTimePricingById, QUEUE_TIME_PACKAGES } from './pricing';

// ============================================
// Types
// ============================================

export interface QueueEntry {
  id: string;
  userId: string;
  position: number;
  joinedAt: Date;
  controlStarted: Date | null;
  controlEndsAt: Date | null;
  tokensPaid: number;
  status: QueueStatus;
  estimatedWaitTime: number; // seconds
}

export interface QueueState {
  currentController: QueueEntry | null;
  waitingUsers: QueueEntry[];
  totalInQueue: number;
  averageSessionDuration: number;
}

// ============================================
// Constants
// ============================================

const QUEUE_CACHE_KEY = 'live:queue:state';
const ACTIVE_CONTROLLER_KEY = 'live:queue:active';
const DEFAULT_SESSION_DURATION = 300; // 5 minutes

// ============================================
// Queue Manager Functions
// ============================================

/**
 * Get current queue state
 */
export async function getQueueState(): Promise<QueueState> {
  // Try cache first
  const cached = await redis.get<QueueState>(QUEUE_CACHE_KEY);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const entries = await db.liveQueue.findMany({
    where: {
      status: { in: ['WAITING', 'ACTIVE'] },
    },
    orderBy: [
      { status: 'desc' }, // ACTIVE first
      { joinedAt: 'asc' },
    ],
  });

  const activeEntry = entries.find((e) => e.status === 'ACTIVE');
  const waitingEntries = entries.filter((e) => e.status === 'WAITING');

  // Calculate estimated wait times
  let cumulativeWait = activeEntry
    ? Math.max(0, (activeEntry.controlEndsAt?.getTime() ?? 0) - Date.now()) / 1000
    : 0;

  const waitingWithEstimates: QueueEntry[] = waitingEntries.map((entry, index) => {
    const waitTime = cumulativeWait;
    cumulativeWait += entry.tokensPaid * 30; // Rough estimate: 30 sec per token
    return {
      id: entry.id,
      userId: entry.userId,
      position: index + 1,
      joinedAt: entry.joinedAt,
      controlStarted: entry.controlStarted,
      controlEndsAt: entry.controlEndsAt,
      tokensPaid: entry.tokensPaid,
      status: entry.status,
      estimatedWaitTime: Math.round(waitTime),
    };
  });

  const state: QueueState = {
    currentController: activeEntry
      ? {
          id: activeEntry.id,
          userId: activeEntry.userId,
          position: 0,
          joinedAt: activeEntry.joinedAt,
          controlStarted: activeEntry.controlStarted,
          controlEndsAt: activeEntry.controlEndsAt,
          tokensPaid: activeEntry.tokensPaid,
          status: activeEntry.status,
          estimatedWaitTime: 0,
        }
      : null,
    waitingUsers: waitingWithEstimates,
    totalInQueue: entries.length,
    averageSessionDuration: DEFAULT_SESSION_DURATION,
  };

  // Cache for 5 seconds
  await redis.set(QUEUE_CACHE_KEY, state, { ex: 5 });

  return state;
}

/**
 * Get user's position in queue
 */
export async function getUserQueuePosition(userId: string): Promise<QueueEntry | null> {
  const entry = await db.liveQueue.findFirst({
    where: {
      userId,
      status: { in: ['WAITING', 'ACTIVE'] },
    },
  });

  if (!entry) return null;

  const state = await getQueueState();

  if (entry.status === 'ACTIVE') {
    return state.currentController;
  }

  const position = state.waitingUsers.find((e) => e.id === entry.id);
  return position ?? null;
}

/**
 * Join the queue
 */
export async function joinQueue(
  userId: string,
  timePackageId: string
): Promise<{ success: boolean; entry?: QueueEntry; error?: string }> {
  // Check if user already in queue
  const existing = await db.liveQueue.findFirst({
    where: {
      userId,
      status: { in: ['WAITING', 'ACTIVE'] },
    },
  });

  if (existing) {
    return { success: false, error: 'Already in queue' };
  }

  // Get time package
  const timePackage = getTimePricingById(timePackageId) ?? QUEUE_TIME_PACKAGES[1];

  // Check user has enough tokens
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tokenBalance: true },
  });

  if (!user || user.tokenBalance < timePackage.tokens) {
    return { success: false, error: 'Insufficient tokens' };
  }

  // Deduct tokens and create queue entry
  const [entry] = await db.$transaction([
    db.liveQueue.create({
      data: {
        userId,
        tokensPaid: timePackage.tokens,
        status: 'WAITING',
      },
    }),
    db.user.update({
      where: { id: userId },
      data: { tokenBalance: { decrement: timePackage.tokens } },
    }),
    db.transaction.create({
      data: {
        userId,
        type: 'SPEND',
        amount: -timePackage.tokens,
        status: 'COMPLETED',
        metadata: { reason: 'queue_join', packageId: timePackageId },
      },
    }),
  ]);

  // Invalidate cache
  await redis.del(QUEUE_CACHE_KEY);

  // Try to activate if queue is empty
  await tryActivateNextUser();

  // Return entry with position
  const position = await getUserQueuePosition(userId);
  return { success: true, entry: position ?? undefined };
}

/**
 * Leave the queue (get refund if waiting)
 */
export async function leaveQueue(
  userId: string
): Promise<{ success: boolean; refunded?: number; error?: string }> {
  const entry = await db.liveQueue.findFirst({
    where: {
      userId,
      status: { in: ['WAITING', 'ACTIVE'] },
    },
  });

  if (!entry) {
    return { success: false, error: 'Not in queue' };
  }

  // Calculate refund (only if waiting, no refund if already playing)
  const refund = entry.status === 'WAITING' ? entry.tokensPaid : 0;

  await db.$transaction([
    db.liveQueue.update({
      where: { id: entry.id },
      data: { status: 'CANCELLED' },
    }),
    ...(refund > 0
      ? [
          db.user.update({
            where: { id: userId },
            data: { tokenBalance: { increment: refund } },
          }),
          db.transaction.create({
            data: {
              userId,
              type: 'REFUND',
              amount: refund,
              status: 'COMPLETED',
              metadata: { reason: 'queue_leave' },
            },
          }),
        ]
      : []),
  ]);

  // Invalidate cache
  await redis.del(QUEUE_CACHE_KEY);

  // Try to activate next user
  await tryActivateNextUser();

  return { success: true, refunded: refund };
}

/**
 * Extend current session time
 */
export async function extendSession(
  userId: string,
  extendPackageId: string
): Promise<{ success: boolean; newEndTime?: Date; error?: string }> {
  const entry = await db.liveQueue.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (!entry) {
    return { success: false, error: 'No active session' };
  }

  const timePackage = getTimePricingById(extendPackageId);
  if (!timePackage) {
    return { success: false, error: 'Invalid package' };
  }

  // Check tokens
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tokenBalance: true },
  });

  if (!user || user.tokenBalance < timePackage.tokens) {
    return { success: false, error: 'Insufficient tokens' };
  }

  // Calculate new end time
  const currentEnd = entry.controlEndsAt ?? new Date();
  const newEndTime = new Date(currentEnd.getTime() + timePackage.duration * 1000);

  await db.$transaction([
    db.liveQueue.update({
      where: { id: entry.id },
      data: {
        controlEndsAt: newEndTime,
        tokensPaid: { increment: timePackage.tokens },
      },
    }),
    db.user.update({
      where: { id: userId },
      data: { tokenBalance: { decrement: timePackage.tokens } },
    }),
    db.transaction.create({
      data: {
        userId,
        type: 'SPEND',
        amount: -timePackage.tokens,
        status: 'COMPLETED',
        metadata: { reason: 'session_extend', packageId: extendPackageId },
      },
    }),
  ]);

  // Invalidate cache
  await redis.del(QUEUE_CACHE_KEY);

  return { success: true, newEndTime };
}

/**
 * Activate the next user in queue
 */
export async function tryActivateNextUser(): Promise<QueueEntry | null> {
  // Check if there's already an active user
  const activeUser = await db.liveQueue.findFirst({
    where: { status: 'ACTIVE' },
  });

  if (activeUser) {
    // Check if session has expired
    if (activeUser.controlEndsAt && activeUser.controlEndsAt < new Date()) {
      await db.liveQueue.update({
        where: { id: activeUser.id },
        data: { status: 'COMPLETED' },
      });
      // Clear their active session cache
      await playSessionCache.clearUserActiveSession(activeUser.userId);
    } else {
      return null; // Still active
    }
  }

  // Get next in queue
  const nextUser = await db.liveQueue.findFirst({
    where: { status: 'WAITING' },
    orderBy: { joinedAt: 'asc' },
  });

  if (!nextUser) {
    return null;
  }

  // Calculate session duration based on tokens paid
  const duration = nextUser.tokensPaid * 30; // 30 seconds per token
  const now = new Date();
  const controlEndsAt = new Date(now.getTime() + duration * 1000);

  const updatedEntry = await db.liveQueue.update({
    where: { id: nextUser.id },
    data: {
      status: 'ACTIVE',
      controlStarted: now,
      controlEndsAt,
    },
  });

  // Set active session in cache
  await playSessionCache.setUserActiveSession(nextUser.userId, nextUser.id);

  // Invalidate cache
  await redis.del(QUEUE_CACHE_KEY);

  return {
    id: updatedEntry.id,
    userId: updatedEntry.userId,
    position: 0,
    joinedAt: updatedEntry.joinedAt,
    controlStarted: updatedEntry.controlStarted,
    controlEndsAt: updatedEntry.controlEndsAt,
    tokensPaid: updatedEntry.tokensPaid,
    status: updatedEntry.status,
    estimatedWaitTime: 0,
  };
}

/**
 * Check if user has active control
 */
export async function hasActiveControl(userId: string): Promise<boolean> {
  const entry = await db.liveQueue.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (!entry) return false;

  // Check if session has expired
  if (entry.controlEndsAt && entry.controlEndsAt < new Date()) {
    await db.liveQueue.update({
      where: { id: entry.id },
      data: { status: 'COMPLETED' },
    });
    await redis.del(QUEUE_CACHE_KEY);
    await tryActivateNextUser();
    return false;
  }

  return true;
}

/**
 * Get remaining control time for user
 */
export async function getRemainingControlTime(userId: string): Promise<number> {
  const entry = await db.liveQueue.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (!entry || !entry.controlEndsAt) return 0;

  const remaining = Math.max(0, (entry.controlEndsAt.getTime() - Date.now()) / 1000);
  return Math.round(remaining);
}
