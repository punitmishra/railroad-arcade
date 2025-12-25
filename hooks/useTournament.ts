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
      // In production, this would fetch from /api/tournaments
      // For now, use mock data
      const mockTournament = createMockTournament();
      const status = getTournamentStatus(mockTournament);

      if (status.canPlay) {
        setActiveTournament(mockTournament);
        setUpcomingTournaments([]);
      } else if (status.canJoin) {
        setActiveTournament(null);
        setUpcomingTournaments([mockTournament]);
      } else {
        setActiveTournament(null);
        setUpcomingTournaments([mockTournament]);
      }

      // Mock past tournaments
      setPastTournaments([
        {
          ...mockTournament,
          id: 'past-weekly-1',
          name: 'Last Week Challenge',
          status: 'COMPLETED',
          participantCount: 87,
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tournaments'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch leaderboard
  const refreshLeaderboard = useCallback(async (tournamentId: string) => {
    try {
      // In production, this would fetch from /api/tournaments/[id]/leaderboard
      // For now, use mock data
      const mockEntries: TournamentEntry[] = [
        { id: '1', tournamentId, userId: 'u1', username: 'SpeedDemon', score: 12500, attempts: 3, rank: 1, registeredAt: new Date() },
        { id: '2', tournamentId, userId: 'u2', username: 'TrainMaster', score: 11200, attempts: 2, rank: 2, registeredAt: new Date() },
        { id: '3', tournamentId, userId: 'u3', username: 'RailRunner', score: 10800, attempts: 3, rank: 3, registeredAt: new Date() },
        { id: '4', tournamentId, userId: 'u4', username: 'Conductor42', score: 9500, attempts: 1, rank: 4, registeredAt: new Date() },
        { id: '5', tournamentId, userId: 'u5', username: 'ChooChoo', score: 8900, attempts: 2, rank: 5, registeredAt: new Date() },
      ];

      setLeaderboard({
        tournamentId,
        entries: mockEntries,
        totalParticipants: 42,
        userEntry: undefined,
      });
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
