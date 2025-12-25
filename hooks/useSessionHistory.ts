'use client';

// ============================================
// Session History Hook
// ============================================
// React hook for fetching and managing session history data

import { useState, useEffect, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface SessionEvent {
  id: string;
  timestamp: Date;
  type: 'TRAIN_START' | 'TRAIN_STOP' | 'JUNCTION_SWITCH' | 'CROSSING_ACTIVATED' | 'SNAPSHOT' | 'ACHIEVEMENT' | 'EMERGENCY' | 'MODULE_UNLOCK';
  description: string;
  trainId?: string;
  level?: number;
}

export interface Session {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tokensSpent: number;
  status: 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED' | 'EMERGENCY_STOPPED';
  totalDistance: number;
  trainsOperated: string[];
  modulesUsed: string[];
  events: SessionEvent[];
  _count?: { events: number };
}

export interface SessionStats {
  totalSessions: number;
  totalDuration: number;
  totalTokensSpent: number;
  totalDistance: number;
  sessionsThisWeek: number;
}

export type DateRange = 'today' | 'week' | 'month' | 'all';

export interface UseSessionHistoryOptions {
  dateRange?: DateRange;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseSessionHistoryReturn {
  sessions: Session[];
  stats: SessionStats;
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useSessionHistory(options: UseSessionHistoryOptions = {}): UseSessionHistoryReturn {
  const { dateRange = 'week', limit = 20, autoFetch = true } = options;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    totalDuration: 0,
    totalTokensSpent: 0,
    totalDistance: 0,
    sessionsThisWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Calculate date filter
  const getDateFilter = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'all':
      default:
        return null;
    }
  }, [dateRange]);

  // Fetch sessions
  const fetchSessions = useCallback(async (loadingMore = false) => {
    if (!loadingMore) {
      setIsLoading(true);
      setCursor(null);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (loadingMore && cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`/api/sessions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();

      // Filter by date range on client side (API returns all for pagination)
      const dateFilter = getDateFilter();
      let filteredSessions = data.sessions || [];

      if (dateFilter) {
        filteredSessions = filteredSessions.filter((s: Session) =>
          new Date(s.startTime) >= dateFilter
        );
      }

      // Convert timestamps to Date objects
      const processedSessions = filteredSessions.map((s: Session & { startTime: string; endTime?: string; events: Array<SessionEvent & { timestamp: string }> }) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: s.endTime ? new Date(s.endTime) : undefined,
        events: (s.events || []).map(e => ({
          ...e,
          timestamp: new Date(e.timestamp),
        })),
      }));

      if (loadingMore) {
        setSessions(prev => [...prev, ...processedSessions]);
      } else {
        setSessions(processedSessions);
      }

      setHasMore(!!data.nextCursor);
      setCursor(data.nextCursor);

      // Calculate stats
      const allSessions = loadingMore
        ? [...sessions, ...processedSessions]
        : processedSessions;

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      setStats({
        totalSessions: allSessions.length,
        totalDuration: allSessions.reduce((acc: number, s: Session) => acc + (s.duration || 0), 0),
        totalTokensSpent: allSessions.reduce((acc: number, s: Session) => acc + s.tokensSpent, 0),
        totalDistance: allSessions.reduce((acc: number, s: Session) => acc + s.totalDistance, 0),
        sessionsThisWeek: allSessions.filter((s: Session) => s.startTime >= weekAgo).length,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setIsLoading(false);
    }
  }, [limit, cursor, getDateFilter, sessions]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchSessions();
    }
  }, [dateRange]); // Re-fetch when date range changes

  // Load more
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchSessions(true);
    }
  }, [hasMore, isLoading, fetchSessions]);

  return {
    sessions,
    stats,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh: () => fetchSessions(false),
  };
}

// ============================================
// Helper Functions
// ============================================

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return '<1m';
}

export function getEventIcon(type: SessionEvent['type']): string {
  switch (type) {
    case 'TRAIN_START': return '🚂';
    case 'TRAIN_STOP': return '🛑';
    case 'JUNCTION_SWITCH': return '🔀';
    case 'CROSSING_ACTIVATED': return '🚧';
    case 'SNAPSHOT': return '📸';
    case 'ACHIEVEMENT': return '🏆';
    case 'EMERGENCY': return '🚨';
    case 'MODULE_UNLOCK': return '🔓';
    default: return '📝';
  }
}

export function getStatusColor(status: Session['status']): string {
  switch (status) {
    case 'COMPLETED': return '#22c55e';
    case 'ACTIVE': return '#3b82f6';
    case 'INTERRUPTED': return '#f59e0b';
    case 'EMERGENCY_STOPPED': return '#ef4444';
    default: return '#6b7280';
  }
}
