'use client';

// ============================================
// Tournament Banner Component
// ============================================
// Displays active and upcoming tournaments with
// registration, countdown, and leaderboard preview.

import { useState, useEffect } from 'react';
import { useTournament } from '@/hooks/useTournament';
import {
  Tournament,
  TournamentType,
  TOURNAMENT_TYPES,
  getTournamentStatus,
  formatCountdown,
} from '@/lib/tournament';
import {
  TrophyIcon,
  ClockIcon,
  UsersIcon,
  CoinsIcon,
  ChevronDownIcon,
  SparklesIcon,
} from './icons';
import { GAME_MODE_CONFIGS, GameModeId } from '@/lib/game-modes/GameModeEngine';

// ============================================
// Main Component
// ============================================

interface TournamentBannerProps {
  onJoinTournament?: (tournament: Tournament) => void;
  onViewLeaderboard?: (tournament: Tournament) => void;
  compact?: boolean;
}

export function TournamentBanner({
  onJoinTournament,
  onViewLeaderboard,
  compact = false,
}: TournamentBannerProps) {
  const {
    activeTournament,
    upcomingTournaments,
    isLoading,
    registerForTournament,
    refreshLeaderboard,
    leaderboard,
  } = useTournament();

  const [expanded, setExpanded] = useState(!compact);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  const displayTournament = activeTournament || upcomingTournaments[0];
  const status = displayTournament ? getTournamentStatus(displayTournament) : null;
  const tournamentConfig = displayTournament ? TOURNAMENT_TYPES[displayTournament.type] : null;
  const gameModeConfig = displayTournament ? GAME_MODE_CONFIGS[displayTournament.gameMode] : null;

  // Update countdown timer
  useEffect(() => {
    if (!displayTournament) return;

    const targetDate = status?.canPlay
      ? displayTournament.endTime
      : displayTournament.startTime;

    const updateCountdown = () => {
      setCountdown(formatCountdown(targetDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [displayTournament, status]);

  // Load leaderboard when expanded
  useEffect(() => {
    if (expanded && displayTournament) {
      refreshLeaderboard(displayTournament.id);
    }
  }, [expanded, displayTournament, refreshLeaderboard]);

  const handleRegister = async () => {
    if (!displayTournament) return;

    const success = await registerForTournament(displayTournament.id);
    if (success) {
      onJoinTournament?.(displayTournament);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10" />
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
            <div className="h-3 bg-white/10 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!displayTournament) {
    return (
      <div className="bg-gradient-to-r from-gray-500/10 to-gray-500/5 rounded-2xl border border-white/10 p-4">
        <div className="flex items-center gap-3 text-gray-500">
          <TrophyIcon size={24} />
          <span className="text-sm">No tournaments scheduled. Check back later!</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all"
      style={{
        background: `linear-gradient(135deg, ${tournamentConfig?.color}15, ${tournamentConfig?.color}05)`,
        borderColor: `${tournamentConfig?.color}30`,
      }}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${tournamentConfig?.color}20` }}
            >
              {tournamentConfig?.icon || '🏆'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className="font-semibold text-[15px]"
                  style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
                >
                  {displayTournament.name}
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase"
                  style={{
                    backgroundColor: `${status?.color}20`,
                    color: status?.color,
                  }}
                >
                  {status?.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {gameModeConfig?.name} • {displayTournament.participantCount}/{displayTournament.maxParticipants} players
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown */}
            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-500 mb-1">
                {status?.canPlay ? 'Ends in' : 'Starts in'}
              </div>
              <div className="flex items-center gap-1">
                {countdown.days > 0 && (
                  <CountdownUnit value={countdown.days} label="d" color={tournamentConfig?.color} />
                )}
                <CountdownUnit value={countdown.hours} label="h" color={tournamentConfig?.color} />
                <CountdownUnit value={countdown.minutes} label="m" color={tournamentConfig?.color} />
                {countdown.days === 0 && (
                  <CountdownUnit value={countdown.seconds} label="s" color={tournamentConfig?.color} />
                )}
              </div>
            </div>

            <ChevronDownIcon
              size={20}
              className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.06]">
          <div className="pt-4 grid md:grid-cols-2 gap-4">
            {/* Left: Details */}
            <div className="space-y-4">
              <p className="text-sm text-gray-400">{displayTournament.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={<CoinsIcon size={16} />}
                  label="Entry Fee"
                  value={`${displayTournament.entryFee} tokens`}
                  color="#f59e0b"
                />
                <StatCard
                  icon={<TrophyIcon size={16} />}
                  label="Prize Pool"
                  value={`${displayTournament.prizePool} tokens`}
                  color="#22c55e"
                />
                <StatCard
                  icon={<SparklesIcon size={16} />}
                  label="Attempts"
                  value={`${displayTournament.attemptsPerPlayer}x`}
                  color="#3b82f6"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {status?.canJoin && !displayTournament.isRegistered && (
                  <button
                    onClick={handleRegister}
                    className="flex-1 py-3 rounded-xl font-medium text-white transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: tournamentConfig?.color }}
                  >
                    Register ({displayTournament.entryFee} tokens)
                  </button>
                )}
                {displayTournament.isRegistered && !status?.canPlay && (
                  <div className="flex-1 py-3 rounded-xl text-center font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    Registered
                  </div>
                )}
                {status?.canPlay && displayTournament.isRegistered && (
                  <button
                    onClick={() => onJoinTournament?.(displayTournament)}
                    className="flex-1 py-3 rounded-xl font-medium text-white bg-green-500 hover:bg-green-600 transition-all"
                  >
                    Play Now
                  </button>
                )}
                <button
                  onClick={() => onViewLeaderboard?.(displayTournament)}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Leaderboard
                </button>
              </div>
            </div>

            {/* Right: Mini Leaderboard */}
            <div className="bg-black/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Top Players</span>
                <UsersIcon size={14} className="text-gray-600" />
              </div>
              {leaderboard?.entries.slice(0, 5).map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0"
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7f32' : '#374151',
                      color: i < 3 ? '#000' : '#fff',
                    }}
                  >
                    {entry.rank}
                  </span>
                  <span className="flex-1 text-sm font-medium truncate">{entry.username}</span>
                  <span className="text-sm font-mono" style={{ color: tournamentConfig?.color }}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
              {!leaderboard?.entries.length && (
                <div className="text-center py-4 text-gray-600 text-sm">
                  No scores yet. Be the first!
                </div>
              )}
            </div>
          </div>

          {/* Prizes */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Prize Distribution</div>
            <div className="flex flex-wrap gap-2">
              {displayTournament.prizes.slice(0, 5).map((prize) => (
                <div
                  key={prize.rank}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {prize.rank === 1 ? '🥇' : prize.rank === 2 ? '🥈' : prize.rank === 3 ? '🥉' : `#${prize.rank}`}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-amber-400">{prize.tokens} tokens</div>
                      {prize.title && <div className="text-[10px] text-gray-500">{prize.title}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function CountdownUnit({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div className="text-center">
      <span
        className="px-2 py-1 rounded bg-white/10 font-mono text-sm font-bold"
        style={{ color }}
      >
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] text-gray-500 ml-0.5">{label}</span>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-1" style={{ color }}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
      </div>
      <div className="font-semibold text-sm" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
