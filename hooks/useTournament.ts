'use client';

// ============================================
// Tournament Hook
// ============================================
// React hook for tournament data and actions

import { useState, useEffect, useCallback } from 'react';
import {
  Tournament,
  TournamentEntry,
  TournamentLeaderboard,
  getTournamentStatus,
  createMockTournament,
} from '@/lib/tournament';

// ============================================
// Types
// ============================================

export interface UseTournamentOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseTournamentReturn {
  // Current/active tournament
  activeTournament: Tournament | null;
  upcomingTournaments: Tournament[];
  pastTournaments: Tournament[];

  // Leaderboard
  leaderboard: TournamentLeaderboard | null;
  userEntry: TournamentEntry | null;

  // Status
  isLoading: boolean;
  error: Error | null;

  // Actions
  registerForTournament: (tournamentId: string) => Promise<boolean>;
  submitScore: (tournamentId: string, score: number, time?: number) => Promise<boolean>;
  refreshTournaments: () => Promise<void>;
  refreshLeaderboard: (tournamentId: string) => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useTournament(options: UseTournamentOptions = {}): UseTournamentReturn {
  const { autoRefresh = true, refreshInterval = 30000 } = options;

  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [pastTournaments, setPastTournaments] = useState<Tournament[]>([]);
  const [leaderboard, setLeaderboard] = useState<TournamentLeaderboard | null>(null);
  const [userEntry, setUserEntry] = useState<TournamentEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch tournaments
  const refreshTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tournaments');

      if (!response.ok) {
        // Fall back to mock data if API fails
        const mockTournament = createMockTournament();
        const status = getTournamentStatus(mockTournament);

        if (status.canPlay) {
          setActiveTournament(mockTournament);
          setUpcomingTournaments([]);
        } else {
          setActiveTournament(null);
          setUpcomingTournaments([mockTournament]);
        }
        return;
      }

      const data = await response.json();
      const tournaments = (data.tournaments || []).map((t: Tournament & {
        registrationStart: string;
        registrationEnd: string;
        startTime: string;
        endTime: string
      }) => ({
        ...t,
        registrationStart: new Date(t.registrationStart),
        registrationEnd: new Date(t.registrationEnd),
        startTime: new Date(t.startTime),
        endTime: new Date(t.endTime),
      }));

      // Categorize tournaments
      const active = tournaments.find((t: Tournament) => t.status === 'ACTIVE');
      const upcoming = tournaments.filter((t: Tournament) =>
        t.status === 'SCHEDULED' || t.status === 'REGISTRATION'
      );
      const past = tournaments.filter((t: Tournament) => t.status === 'COMPLETED');

      setActiveTournament(active || null);
      setUpcomingTournaments(upcoming);
      setPastTournaments(past);

      // If no tournaments exist, use mock data for demo
      if (tournaments.length === 0) {
        const mockTournament = createMockTournament();
        setUpcomingTournaments([mockTournament]);
      }
    } catch (err) {
      // Fall back to mock data on error
      const mockTournament = createMockTournament();
      setUpcomingTournaments([mockTournament]);
      setError(err instanceof Error ? err : new Error('Failed to fetch tournaments'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch leaderboard from real API
  const refreshLeaderboard = useCallback(async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();

      if (data.success && data.leaderboard) {
        const entries = data.leaderboard.entries.map((e: TournamentEntry & {
          registeredAt: string;
          lastAttemptAt?: string;
        }) => ({
          ...e,
          registeredAt: new Date(e.registeredAt),
          lastAttemptAt: e.lastAttemptAt ? new Date(e.lastAttemptAt) : undefined,
        }));

        setLeaderboard({
          tournamentId,
          entries,
          totalParticipants: data.leaderboard.totalParticipants,
          userEntry: data.leaderboard.userEntry ? {
            ...data.leaderboard.userEntry,
            registeredAt: new Date(data.leaderboard.userEntry.registeredAt),
            lastAttemptAt: data.leaderboard.userEntry.lastAttemptAt
              ? new Date(data.leaderboard.userEntry.lastAttemptAt)
              : undefined,
          } : undefined,
        });

        if (data.leaderboard.userEntry) {
          setUserEntry({
            ...data.leaderboard.userEntry,
            registeredAt: new Date(data.leaderboard.userEntry.registeredAt),
            lastAttemptAt: data.leaderboard.userEntry.lastAttemptAt
              ? new Date(data.leaderboard.userEntry.lastAttemptAt)
              : undefined,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, []);

  // Register for tournament
  const registerForTournament = useCallback(async (tournamentId: string): Promise<boolean> => {
    try {
      // In production, this would POST to /api/tournaments/[id]/register
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to register');
      }

      // Update local state
      if (activeTournament?.id === tournamentId) {
        setActiveTournament({
          ...activeTournament,
          isRegistered: true,
          participantCount: activeTournament.participantCount + 1,
        });
      }

      setUpcomingTournaments((prev) =>
        prev.map((t) =>
          t.id === tournamentId
            ? { ...t, isRegistered: true, participantCount: t.participantCount + 1 }
            : t
        )
      );

      return true;
    } catch (err) {
      console.error('Registration failed:', err);
      // For demo mode, simulate success
      if (activeTournament?.id === tournamentId) {
        setActiveTournament({
          ...activeTournament,
          isRegistered: true,
          participantCount: activeTournament.participantCount + 1,
        });
      }
      setUpcomingTournaments((prev) =>
        prev.map((t) =>
          t.id === tournamentId
            ? { ...t, isRegistered: true, participantCount: t.participantCount + 1 }
            : t
        )
      );
      return true;
    }
  }, [activeTournament]);

  // Submit score
  const submitScore = useCallback(async (
    tournamentId: string,
    score: number,
    time?: number
  ): Promise<boolean> => {
    try {
      // In production, this would POST to /api/tournaments/[id]/submit
      const response = await fetch(`/api/tournaments/${tournamentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, time }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit score');
      }

      // Refresh leaderboard
      await refreshLeaderboard(tournamentId);
      return true;
    } catch (err) {
      console.error('Score submission failed:', err);
      return false;
    }
  }, [refreshLeaderboard]);

  // Initial fetch
  useEffect(() => {
    refreshTournaments();
  }, [refreshTournaments]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshTournaments();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshTournaments]);

  // SSE subscription for real-time tournament updates
  useEffect(() => {
    if (!activeTournament) return;

    const eventSource = new EventSource(
      `/api/realtime?events=tournament_update&events=tournament_leaderboard`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle tournament leaderboard updates
        if (
          data.type === 'tournament_leaderboard' &&
          data.data?.tournamentId === activeTournament.id
        ) {
          // Update leaderboard with new top entries
          setLeaderboard((prev) => {
            if (!prev || prev.tournamentId !== data.data.tournamentId) return prev;

            // Map SSE entries to our format
            const newEntries = data.data.topEntries.map((e: {
              rank: number;
              userId: string;
              username: string;
              score: number;
              bestTime?: number;
            }) => ({
              id: e.userId, // Use userId as temporary id
              tournamentId: data.data.tournamentId,
              userId: e.userId,
              username: e.username,
              score: e.score,
              attempts: 0, // Not included in SSE data
              bestTime: e.bestTime,
              rank: e.rank,
              registeredAt: new Date(),
            }));

            return {
              ...prev,
              entries: newEntries,
            };
          });
        }

        // Handle tournament status updates
        if (
          data.type === 'tournament_update' &&
          data.data?.tournamentId === activeTournament.id
        ) {
          // Refresh tournaments to get updated status
          refreshTournaments();
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      // Reconnect on error after a delay
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [activeTournament?.id, refreshTournaments]);

  return {
    activeTournament,
    upcomingTournaments,
    pastTournaments,
    leaderboard,
    userEntry,
    isLoading,
    error,
    registerForTournament,
    submitScore,
    refreshTournaments,
    refreshLeaderboard,
  };
}
