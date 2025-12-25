// ============================================
// Real-Time Updates System (Server-Sent Events)
// ============================================
// Provides real-time updates for train positions, queue status,
// game scores, and other live data using SSE.

// ============================================
// Types
// ============================================

export type RealtimeEventType =
  | 'train_update'
  | 'queue_update'
  | 'score_update'
  | 'achievement'
  | 'session_update'
  | 'system_status'
  | 'leaderboard_update'
  | 'tournament_update'
  | 'tournament_leaderboard'
  | 'tournament_prizes'
  | 'ping'
  | 'connected';

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  data: T;
  timestamp: number;
}

export interface TrainUpdateData {
  trackId: number;
  speed: number;
  direction: 'forward' | 'reverse' | 'stopped';
  position: number;
}

export interface QueueUpdateData {
  totalInQueue: number;
  currentController: string | null;
  waitingCount: number;
  userPosition?: number;
  estimatedWait?: number;
}

export interface ScoreUpdateData {
  userId: string;
  gameMode: string;
  score: number;
  isLive: boolean;
}

export interface AchievementData {
  userId: string;
  achievementType: string;
  earnedAt: string;
}

export interface SessionUpdateData {
  sessionId: string;
  status: 'started' | 'extended' | 'ending' | 'ended';
  remainingTime?: number;
}

export interface SystemStatusData {
  connected: boolean;
  tracksOnline: number;
  cameraOnline: boolean;
  activeUsers: number;
}

export interface LeaderboardUpdateData {
  gameMode: string;
  isLive: boolean;
  entries: Array<{
    rank: number;
    userId: string;
    username: string;
    score: number;
  }>;
}

export interface TournamentUpdateData {
  tournamentId: string;
  status: 'SCHEDULED' | 'REGISTRATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  participantCount?: number;
}

export interface TournamentLeaderboardData {
  tournamentId: string;
  topEntries: Array<{
    rank: number;
    userId: string;
    username: string;
    score: number;
    bestTime?: number;
  }>;
}

export interface TournamentPrizesData {
  tournamentId: string;
  tournamentName: string;
  winnersCount: number;
  prizePool: number;
}

// ============================================
// Event Emitter (Server-side)
// ============================================

type EventCallback = (event: RealtimeEvent) => void;

class RealtimeEventEmitter {
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private globalSubscribers: Set<EventCallback> = new Set();

  /**
   * Subscribe to specific event type
   */
  subscribe(eventType: RealtimeEventType, callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);

    return () => {
      this.subscribers.get(eventType)?.delete(callback);
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(callback: EventCallback): () => void {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T>(type: RealtimeEventType, data: T): void {
    const event: RealtimeEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
    };

    // Notify type-specific subscribers
    this.subscribers.get(type)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in realtime subscriber for ${type}:`, error);
      }
    });

    // Notify global subscribers
    this.globalSubscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in global realtime subscriber:', error);
      }
    });
  }

  /**
   * Get subscriber count for debugging
   */
  getSubscriberCount(eventType?: RealtimeEventType): number {
    if (eventType) {
      return this.subscribers.get(eventType)?.size ?? 0;
    }
    let total = this.globalSubscribers.size;
    this.subscribers.forEach((subs) => {
      total += subs.size;
    });
    return total;
  }
}

// Singleton instance
export const realtimeEmitter = new RealtimeEventEmitter();

// ============================================
// Convenience Emit Functions
// ============================================

export function emitTrainUpdate(data: TrainUpdateData): void {
  realtimeEmitter.emit('train_update', data);
}

export function emitQueueUpdate(data: QueueUpdateData): void {
  realtimeEmitter.emit('queue_update', data);
}

export function emitScoreUpdate(data: ScoreUpdateData): void {
  realtimeEmitter.emit('score_update', data);
}

export function emitAchievement(data: AchievementData): void {
  realtimeEmitter.emit('achievement', data);
}

export function emitSessionUpdate(data: SessionUpdateData): void {
  realtimeEmitter.emit('session_update', data);
}

export function emitSystemStatus(data: SystemStatusData): void {
  realtimeEmitter.emit('system_status', data);
}

export function emitLeaderboardUpdate(data: LeaderboardUpdateData): void {
  realtimeEmitter.emit('leaderboard_update', data);
}

export function emitTournamentUpdate(data: TournamentUpdateData): void {
  realtimeEmitter.emit('tournament_update', data);
}

export function emitTournamentLeaderboard(data: TournamentLeaderboardData): void {
  realtimeEmitter.emit('tournament_leaderboard', data);
}

export function emitTournamentPrizes(data: TournamentPrizesData): void {
  realtimeEmitter.emit('tournament_prizes', data);
}

// ============================================
// SSE Response Helper (for API routes)
// ============================================

export function createSSEStream(
  eventTypes?: RealtimeEventType[]
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectEvent = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Subscribe to events
      const unsubscribe = eventTypes
        ? eventTypes.map((type) =>
            realtimeEmitter.subscribe(type, (event) => {
              const sseData = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            })
          )
        : [
            realtimeEmitter.subscribeAll((event) => {
              const sseData = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }),
          ];

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        const ping = `data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`;
        try {
          controller.enqueue(encoder.encode(ping));
        } catch {
          // Stream closed
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      return () => {
        clearInterval(heartbeat);
        unsubscribe.forEach((unsub) => unsub());
      };
    },
  });
}

// ============================================
// Client-Side SSE Hook Data
// ============================================

export interface UseRealtimeOptions {
  eventTypes?: RealtimeEventType[];
  onEvent?: (event: RealtimeEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Create SSE connection URL with optional event type filter
 */
export function getSSEUrl(eventTypes?: RealtimeEventType[]): string {
  const baseUrl = '/api/realtime';
  if (!eventTypes || eventTypes.length === 0) {
    return baseUrl;
  }
  const params = new URLSearchParams();
  eventTypes.forEach((type) => params.append('events', type));
  return `${baseUrl}?${params.toString()}`;
}
