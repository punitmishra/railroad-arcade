'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLeaderboard, useAllLeaderboards, LeaderboardEntry } from '@/hooks/useLeaderboard';
import { TrophyIcon, ArrowLeftIcon, TrainIcon, ClockIcon, SparklesIcon } from '@/components/icons';
import { SkeletonRow } from '@/components/ui';

const GAME_MODES = [
  { id: 'FREE_PLAY', name: 'Free Play', color: 'cyan', description: 'Sandbox mode' },
  { id: 'SPEED_RUN', name: 'Speed Run', color: 'amber', description: 'Fastest circuit' },
  { id: 'DELIVERY_MISSION', name: 'Delivery', color: 'emerald', description: 'Cargo transport' },
  { id: 'SURVIVAL', name: 'Survival', color: 'red', description: 'Avoid collisions' },
  { id: 'TIME_ATTACK', name: 'Time Attack', color: 'purple', description: 'Score in limited time' },
] as const;

export default function LeaderboardsPage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<string>('FREE_PLAY');
  const [showLive, setShowLive] = useState(false);

  const { entries, isLoading, error, refresh } = useLeaderboard({
    gameMode: selectedMode,
    isLive: showLive,
    limit: 20,
  });

  const selectedModeConfig = GAME_MODES.find(m => m.id === selectedMode);

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Back to home"
            >
              <ArrowLeftIcon size={20} />
            </button>
            <div className="flex-1">
              <h1
                className="text-lg sm:text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Leaderboards
              </h1>
              <p className="text-xs text-gray-500">Top players by game mode</p>
            </div>
            <button
              onClick={() => refresh()}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Refresh leaderboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Mode/Live Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Game Mode Tabs */}
          <div className="flex-1 flex flex-wrap gap-1.5 sm:gap-2">
            {GAME_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all min-h-[36px] ${
                  selectedMode === mode.id
                    ? `bg-${mode.color}-500/20 text-${mode.color}-400 border border-${mode.color}-500/30`
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
                style={{
                  backgroundColor: selectedMode === mode.id ? `rgba(var(--color-${mode.color}-500), 0.2)` : undefined,
                }}
              >
                {mode.name}
              </button>
            ))}
          </div>

          {/* Live/Demo Toggle */}
          <div className="flex items-center gap-2 p-1 rounded-lg bg-white/5 border border-white/10">
            <button
              onClick={() => setShowLive(false)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all min-h-[32px] ${
                !showLive
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Demo
            </button>
            <button
              onClick={() => setShowLive(true)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all min-h-[32px] ${
                showLive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Live
            </button>
          </div>
        </div>

        {/* Current Mode Info */}
        {selectedModeConfig && (
          <div className="rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <TrophyIcon size={24} className="text-amber-400 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1">
                  {selectedModeConfig.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {selectedModeConfig.description} {showLive ? '(Live Hardware)' : '(Demo Mode)'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State with Skeletons */}
        {isLoading && (
          <div className="space-y-3" aria-label="Loading leaderboard">
            {[1, 2, 3, 4, 5].map(i => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <p className="text-red-400 text-sm">Failed to load leaderboard. Please try again.</p>
            <button
              onClick={() => refresh()}
              className="mt-3 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Leaderboard List */}
        {!isLoading && !error && (
          <div className="space-y-2 sm:space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-[#0c0c14] border border-white/10">
                <TrophyIcon size={40} className="text-gray-600 mx-auto mb-4 sm:w-12 sm:h-12" />
                <h3 className="text-base sm:text-lg font-medium text-gray-400 mb-2">No Scores Yet</h3>
                <p className="text-xs sm:text-sm text-gray-500">Be the first to set a high score!</p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <LeaderboardRow key={entry.user.id} entry={entry} index={index} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const isTopThree = index < 3;
  const rankColors = ['text-amber-400', 'text-gray-300', 'text-amber-600'];
  const rankBgColors = ['bg-amber-500/20', 'bg-gray-400/20', 'bg-amber-600/20'];

  return (
    <div
      className={`rounded-xl border p-3 sm:p-4 transition-all ${
        isTopThree
          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20'
          : 'bg-[#0c0c14] border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Rank */}
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isTopThree ? rankBgColors[index] : 'bg-white/5'
          }`}
        >
          {isTopThree ? (
            <span className={`text-lg sm:text-xl font-bold ${rankColors[index]}`}>
              {index === 0 ? '1' : index === 1 ? '2' : '3'}
            </span>
          ) : (
            <span className="text-sm sm:text-base font-medium text-gray-400">{entry.rank}</span>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {entry.user.image ? (
            <Image
              src={entry.user.image}
              alt={entry.user.name}
              width={36}
              height={36}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs sm:text-sm font-bold text-white">
                {entry.user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-white text-sm sm:text-base truncate">
              {entry.user.name}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              {new Date(entry.achievedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <div className={`text-lg sm:text-xl font-bold font-mono ${isTopThree ? 'text-amber-400' : 'text-white'}`}>
            {entry.score.toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500">points</div>
        </div>

        {/* Trophy for top 3 */}
        {isTopThree && (
          <div className="hidden sm:flex items-center justify-center w-8">
            {index === 0 && <SparklesIcon size={20} className="text-amber-400" />}
          </div>
        )}
      </div>
    </div>
  );
}
