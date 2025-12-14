'use client';

// ============================================
// Leaderboard Quick View Component
// ============================================
// Compact widget showing top 3 scores for a game mode
// with a link to the full leaderboards page.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { TrophyIcon, SparklesIcon } from './icons';
import { GameModeId, GAME_MODE_CONFIGS } from '@/lib/game-modes/GameModeEngine';

// ============================================
// Types
// ============================================

interface LeaderboardEntry {
  rank: number;
  score: number;
  achievedAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface LeaderboardQuickViewProps {
  gameMode?: GameModeId;
  isLive?: boolean;
  showTitle?: boolean;
  className?: string;
}

// ============================================
// Component
// ============================================

export function LeaderboardQuickView({
  gameMode = 'FREE_PLAY',
  isLive = false,
  showTitle = true,
  className = '',
}: LeaderboardQuickViewProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = GAME_MODE_CONFIGS[gameMode];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          mode: gameMode,
          live: isLive.toString(),
          limit: '3',
        });

        const response = await fetch(`/api/leaderboards?${params}`);
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        if (data.success) {
          setEntries(data.data.entries);
        } else {
          throw new Error(data.error || 'Failed to fetch leaderboard');
        }
      } catch (err) {
        setError('Could not load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [gameMode, isLive]);

  const rankColors = ['text-amber-400', 'text-gray-300', 'text-amber-600'];
  const rankBgColors = ['bg-amber-500/20', 'bg-gray-400/10', 'bg-amber-600/10'];
  const rankEmojis = ['1', '2', '3'];

  return (
    <div className={`rounded-xl bg-[#12121c] border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      {showTitle && (
        <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrophyIcon size={18} className="text-amber-400" />
            <span className="font-medium text-white text-sm">{config.name} Leaders</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}`}>
            {isLive ? 'Live' : 'Demo'}
          </span>
        </div>
      )}

      <div className="p-3">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-white/10" />
                <div className="flex-1 h-4 rounded bg-white/10" />
                <div className="w-12 h-4 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-4 text-gray-500 text-sm">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && entries.length === 0 && (
          <div className="text-center py-4">
            <SparklesIcon size={24} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">No scores yet</p>
            <p className="text-gray-600 text-[10px]">Be the first!</p>
          </div>
        )}

        {/* Leaderboard Entries */}
        {!isLoading && !error && entries.length > 0 && (
          <div className="space-y-1.5">
            {entries.map((entry, index) => (
              <div
                key={entry.user.id}
                className={`flex items-center gap-2 p-2 rounded-lg ${rankBgColors[index]} transition-colors`}
              >
                {/* Rank */}
                <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0">
                  <span className={`text-sm font-bold ${rankColors[index]}`}>
                    {rankEmojis[index]}
                  </span>
                </div>

                {/* User */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {entry.user.image ? (
                    <Image
                      src={entry.user.image}
                      alt={entry.user.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-bold text-white">
                        {entry.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-white truncate">{entry.user.name}</span>
                </div>

                {/* Score */}
                <span className={`text-sm font-bold font-mono ${rankColors[index]}`}>
                  {entry.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* View All Link */}
        <a
          href="/leaderboards"
          className="block mt-3 py-2 text-center text-xs text-gray-400 hover:text-amber-400 transition-colors border-t border-white/5"
        >
          View All Rankings →
        </a>
      </div>
    </div>
  );
}

// ============================================
// Mini Variant (even more compact)
// ============================================

export function LeaderboardMini({ gameMode = 'FREE_PLAY', isLive = false }: { gameMode?: GameModeId; isLive?: boolean }) {
  const [topScore, setTopScore] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const params = new URLSearchParams({
          mode: gameMode,
          live: isLive.toString(),
          limit: '1',
        });
        const response = await fetch(`/api/leaderboards?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.entries.length > 0) {
            setTopScore(data.data.entries[0]);
          }
        }
      } catch {
        // Silently fail
      }
    };
    fetchTop();
  }, [gameMode, isLive]);

  if (!topScore) return null;

  return (
    <a
      href="/leaderboards"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
    >
      <TrophyIcon size={14} className="text-amber-400" />
      <span className="text-xs text-amber-400">
        Top: {topScore.score.toLocaleString()}
      </span>
    </a>
  );
}
