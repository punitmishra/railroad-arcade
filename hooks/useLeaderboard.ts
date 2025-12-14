'use client';

// ============================================
// Leaderboard Hook
// ============================================
// React hook for fetching and managing leaderboard data

import { useState, useEffect, useCallback } from 'react';
import { useLeaderboardUpdates } from './useRealtime';

// ============================================
// Types
// ============================================

export interface LeaderboardEntry {
  rank: number;
  score: number;
  achievedAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface UseLeaderboardOptions {
  gameMode?: string;
  isLive?: boolean;
  limit?: number;
  autoRefresh?: boolean;
}

export interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  submitScore: (score: number) => Promise<{
    success: boolean;
    newHighScore?: boolean;
    rank?: number;
  }>;
}

// ============================================
// Hook Implementation
// ============================================

export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const {
    gameMode = 'FREE_PLAY',
    isLive = false,
    limit = 10,
    autoRefresh = true,
  } = options;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Listen for real-time leaderboard updates
  const { leaderboard: realtimeUpdate } = useLeaderboardUpdates(gameMode, isLive);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        mode: gameMode,
        live: isLive.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/leaderboards?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      if (data.success) {
        setEntries(data.data.entries);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setIsLoading(false);
    }
  }, [gameMode, isLive, limit]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Handle real-time updates
  useEffect(() => {
    if (realtimeUpdate && autoRefresh) {
      // Update entries from real-time data
      const newEntries = realtimeUpdate.entries.map((e) => ({
        rank: e.rank,
        score: e.score,
        achievedAt: new Date().toISOString(),
        user: {
          id: e.userId,
          name: e.username,
        },
      }));
      setEntries(newEntries);
    }
  }, [realtimeUpdate, autoRefresh]);

  // Submit score
  const submitScore = useCallback(
    async (score: number) => {
      try {
        const response = await fetch('/api/leaderboards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameMode, score, isLive }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit score');
        }

        const data = await response.json();
        if (data.success) {
          // Refresh leaderboard after submission
          await fetchLeaderboard();
          return {
            success: true,
            newHighScore: data.data.newHighScore,
            rank: data.data.rank,
          };
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Score submission failed:', err);
        return { success: false };
      }
    },
    [gameMode, isLive, fetchLeaderboard]
  );

  return {
    entries,
    isLoading,
    error,
    refresh: fetchLeaderboard,
    submitScore,
  };
}

// ============================================
// Multiple Game Modes Hook
// ============================================

export function useAllLeaderboards(isLive: boolean = false) {
  const gameModes = ['FREE_PLAY', 'SPEED_RUN', 'DELIVERY_MISSION', 'SURVIVAL', 'TIME_ATTACK'];

  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);

    const results: Record<string, LeaderboardEntry[]> = {};

    await Promise.all(
      gameModes.map(async (mode) => {
        try {
          const params = new URLSearchParams({
            mode,
            live: isLive.toString(),
            limit: '5',
          });

          const response = await fetch(`/api/leaderboards?${params}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              results[mode] = data.data.entries;
            }
          }
        } catch {
          results[mode] = [];
        }
      })
    );

    setLeaderboards(results);
    setIsLoading(false);
  }, [isLive]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { leaderboards, isLoading, refresh: fetchAll };
}
