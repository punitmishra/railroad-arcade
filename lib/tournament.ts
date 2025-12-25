'use client';

// ============================================
// Tournament Mode System
// ============================================
// Scheduled competitive events with brackets,
// leaderboards, and prizes.

import { GameModeId } from './game-modes/GameModeEngine';

// ============================================
// Types
// ============================================

export type TournamentStatus = 'SCHEDULED' | 'REGISTRATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type TournamentType = 'DAILY' | 'WEEKLY' | 'SPECIAL' | 'CHAMPIONSHIP';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: TournamentType;
  status: TournamentStatus;
  gameMode: GameModeId;

  // Schedule
  registrationStart: Date;
  registrationEnd: Date;
  startTime: Date;
  endTime: Date;

  // Rules
  maxParticipants: number;
  entryFee: number; // tokens
  minLevel: number;
  attemptsPerPlayer: number;

  // Prizes
  prizes: TournamentPrize[];
  prizePool: number;

  // Participants
  participantCount: number;
  isRegistered?: boolean;
}

export interface TournamentPrize {
  rank: number;
  tokens: number;
  badge?: string;
  title?: string;
}

export interface TournamentEntry {
  id: string;
  tournamentId: string;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  attempts: number;
  bestTime?: number;
  rank: number;
  registeredAt: Date;
  lastAttemptAt?: Date;
}

export interface TournamentLeaderboard {
  tournamentId: string;
  entries: TournamentEntry[];
  totalParticipants: number;
  userEntry?: TournamentEntry;
}

// ============================================
// Tournament Configuration
// ============================================

export const TOURNAMENT_TYPES: Record<TournamentType, {
  name: string;
  description: string;
  color: string;
  icon: string;
}> = {
  DAILY: {
    name: 'Daily Challenge',
    description: 'Compete daily for tokens and glory',
    color: '#3b82f6', // blue
    icon: '🌟',
  },
  WEEKLY: {
    name: 'Weekly Tournament',
    description: 'Week-long competition with bigger prizes',
    color: '#8b5cf6', // purple
    icon: '🏆',
  },
  SPECIAL: {
    name: 'Special Event',
    description: 'Limited-time themed tournaments',
    color: '#f59e0b', // amber
    icon: '✨',
  },
  CHAMPIONSHIP: {
    name: 'Championship',
    description: 'Elite competition for top players',
    color: '#ef4444', // red
    icon: '👑',
  },
};

// Default prize distributions
export const DEFAULT_PRIZE_TIERS: TournamentPrize[] = [
  { rank: 1, tokens: 500, badge: 'champion', title: 'Tournament Champion' },
  { rank: 2, tokens: 300, badge: 'silver' },
  { rank: 3, tokens: 200, badge: 'bronze' },
  { rank: 4, tokens: 100 },
  { rank: 5, tokens: 75 },
  { rank: 6, tokens: 50 },
  { rank: 7, tokens: 50 },
  { rank: 8, tokens: 50 },
  { rank: 9, tokens: 25 },
  { rank: 10, tokens: 25 },
];

// ============================================
// Helper Functions
// ============================================

export function getTournamentStatus(tournament: Tournament): {
  label: string;
  color: string;
  canJoin: boolean;
  canPlay: boolean;
} {
  const now = new Date();

  if (tournament.status === 'CANCELLED') {
    return { label: 'Cancelled', color: '#6b7280', canJoin: false, canPlay: false };
  }

  if (tournament.status === 'COMPLETED') {
    return { label: 'Completed', color: '#10b981', canJoin: false, canPlay: false };
  }

  if (now < tournament.registrationStart) {
    return { label: 'Coming Soon', color: '#8b5cf6', canJoin: false, canPlay: false };
  }

  if (now >= tournament.registrationStart && now < tournament.registrationEnd) {
    const spotsLeft = tournament.maxParticipants - tournament.participantCount;
    if (spotsLeft <= 0) {
      return { label: 'Full', color: '#ef4444', canJoin: false, canPlay: false };
    }
    return { label: 'Registration Open', color: '#3b82f6', canJoin: true, canPlay: false };
  }

  if (now >= tournament.startTime && now < tournament.endTime) {
    return { label: 'Live Now', color: '#22c55e', canJoin: false, canPlay: true };
  }

  return { label: 'Ended', color: '#6b7280', canJoin: false, canPlay: false };
}

export function formatTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return 'Now';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatCountdown(targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isExpired: false,
  };
}

// Mock tournament for development/demo
export function createMockTournament(): Tournament {
  const now = new Date();
  const startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours duration

  return {
    id: 'demo-weekly-1',
    name: 'Weekly Speed Challenge',
    description: 'Complete the Speed Run mode with the highest score to win tokens and glory!',
    type: 'WEEKLY',
    status: 'REGISTRATION',
    gameMode: 'SPEED_RUN',
    registrationStart: new Date(now.getTime() - 60 * 60 * 1000), // Started 1 hour ago
    registrationEnd: startTime,
    startTime,
    endTime,
    maxParticipants: 100,
    entryFee: 10,
    minLevel: 1,
    attemptsPerPlayer: 3,
    prizes: DEFAULT_PRIZE_TIERS,
    prizePool: 1500,
    participantCount: 42,
    isRegistered: false,
  };
}
