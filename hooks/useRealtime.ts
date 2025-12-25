'use client';

// ============================================
// Real-Time Updates Hook
// ============================================
// React hook for consuming SSE real-time updates

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RealtimeEvent,
  RealtimeEventType,
  TrainUpdateData,
  QueueUpdateData,
  ScoreUpdateData,
  AchievementData,
  SessionUpdateData,
  SystemStatusData,
  LeaderboardUpdateData,
  getSSEUrl,
} from '@/lib/realtime';

// ============================================
// Types
// ============================================

export interface UseRealtimeOptions {
  eventTypes?: RealtimeEventType[];
  autoConnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface UseRealtimeReturn {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
}

// ============================================
// Main Hook
// ============================================

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const {
    eventTypes,
    autoConnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing connection and clear reference
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const url = getSSEUrl(eventTypes);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEvent;
        if (data.type !== 'ping' && data.type !== 'connected') {
          setLastEvent(data);
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);

      // Close and clear the current connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current);
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        setError(new Error('Max reconnection attempts reached'));
      }
    };
  }, [eventTypes, reconnectDelay, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    error,
    connect,
    disconnect,
  };
}

// ============================================
// Specialized Hooks
// ============================================

/**
 * Hook for train position updates
 */
export function useTrainUpdates() {
  const [trains, setTrains] = useState<Map<number, TrainUpdateData>>(new Map());
  const { isConnected, lastEvent, error } = useRealtime({
    eventTypes: ['train_update'],
  });

  useEffect(() => {
    if (lastEvent?.type === 'train_update') {
      const data = lastEvent.data as TrainUpdateData;
      setTrains((prev) => {
        const next = new Map(prev);
        next.set(data.trackId, data);
        return next;
      });
    }
  }, [lastEvent]);

  return {
    trains: Array.from(trains.values()),
    isConnected,
    error,
  };
}

/**
 * Hook for queue status updates
 */
export function useQueueUpdates() {
  const [queue, setQueue] = useState<QueueUpdateData | null>(null);
  const { isConnected, lastEvent, error } = useRealtime({
    eventTypes: ['queue_update'],
  });

  useEffect(() => {
    if (lastEvent?.type === 'queue_update') {
      setQueue(lastEvent.data as QueueUpdateData);
    }
  }, [lastEvent]);

  return {
    queue,
    isConnected,
    error,
  };
}

/**
 * Hook for score updates
 */
export function useScoreUpdates(gameMode?: string) {
  const [scores, setScores] = useState<ScoreUpdateData[]>([]);
  const { isConnected, lastEvent, error } = useRealtime({
    eventTypes: ['score_update'],
  });

  useEffect(() => {
    if (lastEvent?.type === 'score_update') {
      const data = lastEvent.data as ScoreUpdateData;
      if (!gameMode || data.gameMode === gameMode) {
        setScores((prev) => [...prev.slice(-99), data]);
      }
    }
  }, [lastEvent, gameMode]);

  return {
    scores,
    latestScore: scores[scores.length - 1] || null,
    isConnected,
    error,
  };
}

/**
 * Hook for achievement notifications
 */
export function useAchievementNotifications() {
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const { isConnected, lastEvent, error } = useRealtime({
    eventTypes: ['achievement'],
  });

  useEffect(() => {
    if (lastEvent?.type === 'achievement') {
      setAchievements((prev) => [...prev, lastEvent.data as AchievementData]);
    }
  }, [lastEvent]);

  const clearAchievements = useCallback(() => {
    setAchievements([]);
  }, []);

  return {
    achievements,
    latestAchievement: achievements[achievements.length - 1] || null,
    clearAchievements,
    isConnected,
    error,
  };
}

/**
 * Hook for session updates
 */
export function useSessionUpdates(sessionId?: string) {
  const [session, setSession] = useState<SessionUpdateData | null>(null);
  const { isConnected, lastEvent, error } = useRealtime({
    eventTypes: ['session_update'],
  });

  useEffect(() => {
    if (lastEvent?.type === 'session_update') {
      const data = lastEvent.data as SessionUpdateData;
      if (!sessionId || data.sessionId === sessionId) {
        setSession(data);
      }
    }
  }, [lastEvent, sessionId]);

  return {
    session,
    isConnected,
    error,
  };
}

/**
 * Hook for system status
 */
export function useSystemStatusUpdates() {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const { isConnected, lastEvent, error } = useRealtime({
    eventTypes: ['system_status'],
  });

  useEffect(() => {
    if (lastEvent?.type === 'system_status') {
      setStatus(lastEvent.data as SystemStatusData);
    }
  }, [lastEvent]);

  return {
    status,
    isConnected,
    error,
  };
}

/**
 * Hook for leaderboard updates
 */
export function useLeaderboardUpdates(gameMode?: string, isLive?: boolean) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUpdateData | null>(null);
  const { isConnected, lastEvent, error } = useRealtime({
    eventTypes: ['leaderboard_update'],
  });

  useEffect(() => {
    if (lastEvent?.type === 'leaderboard_update') {
      const data = lastEvent.data as LeaderboardUpdateData;
      if (
        (!gameMode || data.gameMode === gameMode) &&
        (isLive === undefined || data.isLive === isLive)
      ) {
        setLeaderboard(data);
      }
    }
  }, [lastEvent, gameMode, isLive]);

  return {
    leaderboard,
    isConnected,
    error,
  };
}
