'use client';

import { useState, useEffect } from 'react';
import { GameState, ScoringEvent } from '@/lib/game-modes/GameModeEngine';

// ============================================
// Game HUD Component
// ============================================

interface GameHUDProps {
  gameState: GameState | null;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
}

export function GameHUD({ gameState, onPause, onResume, onEnd }: GameHUDProps) {
  if (!gameState || !gameState.isActive) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-16 sm:top-20 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:right-4 md:w-80 z-40 pointer-events-none">
      <div className="bg-[#0a0a0f]/95 backdrop-blur-xl rounded-lg sm:rounded-xl border border-white/10 overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-cyan-400 truncate" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {gameState.mode.replace('_', ' ')}
          </span>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {gameState.isPaused ? (
              <button
                onClick={onResume}
                className="p-1.5 sm:p-1 rounded hover:bg-white/10 text-emerald-400 min-w-[32px] min-h-[32px] flex items-center justify-center"
                aria-label="Resume"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="p-1.5 sm:p-1 rounded hover:bg-white/10 text-amber-400 min-w-[32px] min-h-[32px] flex items-center justify-center"
                aria-label="Pause"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
            )}
            <button
              onClick={onEnd}
              className="p-1.5 sm:p-1 rounded hover:bg-white/10 text-red-400 min-w-[32px] min-h-[32px] flex items-center justify-center"
              aria-label="End game"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Score and Time */}
          <div className="flex items-center justify-between">
            {/* Score */}
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                {gameState.score.toLocaleString()}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500">SCORE</div>
            </div>

            {/* Multiplier */}
            {gameState.multiplier > 1 && (
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">
                  x{gameState.multiplier.toFixed(1)}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500">COMBO</div>
              </div>
            )}

            {/* Time */}
            <div className="text-right">
              <div className={`text-xl sm:text-2xl font-bold font-mono ${
                gameState.remainingTime !== null && gameState.remainingTime <= 30
                  ? 'text-red-400 animate-pulse'
                  : 'text-cyan-400'
              }`}>
                {gameState.remainingTime !== null
                  ? formatTime(gameState.remainingTime)
                  : formatTime(gameState.elapsedTime)
                }
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500">
                {gameState.remainingTime !== null ? 'REMAIN' : 'ELAPSED'}
              </div>
            </div>
          </div>

          {/* Objectives */}
          {gameState.objectives.length > 0 && (
            <div className="pt-2 sm:pt-3 border-t border-white/10">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2">OBJECTIVES</div>
              <div className="space-y-1.5 sm:space-y-2">
                {gameState.objectives.map((obj) => (
                  <div key={obj.id} className="flex items-center gap-1.5 sm:gap-2">
                    <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      obj.completed ? 'bg-emerald-500' : 'bg-white/10'
                    }`}>
                      {obj.completed && (
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 text-xs sm:text-sm text-gray-300 line-clamp-1">{obj.description}</div>
                    <div className="text-xs sm:text-sm text-gray-500 font-mono flex-shrink-0">
                      {obj.current}/{obj.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Events - hidden on very small screens */}
          {gameState.recentEvents.length > 0 && (
            <div className="hidden sm:block pt-3 border-t border-white/10">
              <div className="text-xs text-gray-500 mb-2">RECENT</div>
              <div className="space-y-1 max-h-24 overflow-hidden">
                {gameState.recentEvents.slice(0, 3).map((event, index) => (
                  <ScorePopup key={`${event.timestamp}-${index}`} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="pt-2 sm:pt-3 border-t border-white/10 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            <div>
              <div className="text-base sm:text-lg font-bold text-white font-mono">{gameState.stats.lapsCompleted}</div>
              <div className="text-[9px] sm:text-[10px] text-gray-500">LAPS</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white font-mono">{gameState.stats.topSpeed}</div>
              <div className="text-[9px] sm:text-[10px] text-gray-500">TOP SPD</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white font-mono">{gameState.stats.nearMisses}</div>
              <div className="text-[9px] sm:text-[10px] text-gray-500">CLOSE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Score Popup Component
// ============================================

function ScorePopup({ event }: { event: ScoringEvent }) {
  return (
    <div className="flex items-center justify-between text-sm animate-fadeIn">
      <span className="text-gray-400">{event.description}</span>
      <span className={`font-mono ${event.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {event.points >= 0 ? '+' : ''}{event.points}
        {event.multiplier > 1 && (
          <span className="text-amber-400 ml-1">x{event.multiplier}</span>
        )}
      </span>
    </div>
  );
}

// ============================================
// Game Over Screen
// ============================================

interface GameOverProps {
  gameState: GameState;
  isNewHighScore?: boolean;
  previousHighScore?: number;
  rank?: number;
  onPlayAgain: () => void;
  onChangeMode?: () => void;
  onViewLeaderboard?: () => void;
  onExit: () => void;
}

export function GameOverScreen({
  gameState,
  isNewHighScore = false,
  previousHighScore = 0,
  rank,
  onPlayAgain,
  onChangeMode,
  onViewLeaderboard,
  onExit,
}: GameOverProps) {
  const [showConfetti, setShowConfetti] = useState(isNewHighScore);

  useEffect(() => {
    if (isNewHighScore) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isNewHighScore]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Confetti Effect */}
      {showConfetti && <ConfettiEffect />}

      <div className="bg-[#12121c] rounded-xl sm:rounded-2xl border border-white/10 p-5 sm:p-8 max-w-md w-full text-center max-h-[90vh] overflow-y-auto relative">
        {/* High Score Badge */}
        {isNewHighScore && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/30 animate-bounce">
              NEW HIGH SCORE!
            </div>
          </div>
        )}

        <h2
          className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-1 sm:mb-2 mt-2"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          GAME OVER
        </h2>
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">{gameState.mode.replace('_', ' ')}</p>

        {/* Final Score */}
        <div className="mb-6 sm:mb-8">
          <div className={`text-4xl sm:text-6xl font-bold font-mono mb-1 sm:mb-2 ${
            isNewHighScore
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 animate-pulse'
              : 'text-white'
          }`}>
            {gameState.score.toLocaleString()}
          </div>
          <div className="text-gray-500 text-xs sm:text-sm">FINAL SCORE</div>

          {/* Previous High Score */}
          {isNewHighScore && previousHighScore > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Previous best: <span className="text-gray-400">{previousHighScore.toLocaleString()}</span>
              <span className="text-emerald-400 ml-2">+{(gameState.score - previousHighScore).toLocaleString()}</span>
            </div>
          )}

          {/* Rank Badge */}
          {rank && rank <= 10 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
              <span className="text-2xl">{rank === 1 ? '1' : rank === 2 ? '2' : rank === 3 ? '3' : ''}</span>
              <span className="text-amber-400 font-medium">#{rank} on Leaderboard</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="p-2 sm:p-3 rounded-lg bg-white/5">
            <div className="text-lg sm:text-2xl font-bold text-cyan-400 font-mono">
              {gameState.stats.lapsCompleted}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">Laps</div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-white/5">
            <div className="text-lg sm:text-2xl font-bold text-amber-400 font-mono">
              {gameState.stats.topSpeed}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">Top Speed</div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-white/5">
            <div className="text-lg sm:text-2xl font-bold text-purple-400 font-mono">
              {formatTime(gameState.elapsedTime)}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">Time</div>
          </div>
        </div>

        {/* Objectives */}
        {gameState.objectives.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="text-[10px] sm:text-xs text-gray-500 mb-2">OBJECTIVES</div>
            <div className="space-y-1.5 sm:space-y-2">
              {gameState.objectives.map((obj) => (
                <div
                  key={obj.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-left ${
                    obj.completed ? 'bg-emerald-500/10' : 'bg-white/5'
                  }`}
                >
                  <span className={`text-xs sm:text-sm ${obj.completed ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {obj.description}
                  </span>
                  <span className={`font-mono text-xs sm:text-sm ml-2 ${obj.completed ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {obj.current}/{obj.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onPlayAgain}
              className="flex-1 px-3 sm:px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity min-h-[48px] text-sm sm:text-base"
            >
              Play Again
            </button>
            {onChangeMode && (
              <button
                onClick={onChangeMode}
                className="flex-1 px-3 sm:px-4 py-3 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors min-h-[48px] text-sm sm:text-base"
              >
                Change Mode
              </button>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3">
            {onViewLeaderboard && (
              <button
                onClick={onViewLeaderboard}
                className="flex-1 px-3 sm:px-4 py-2.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors min-h-[44px] text-sm"
              >
                View Leaderboard
              </button>
            )}
            <button
              onClick={onExit}
              className="flex-1 px-3 sm:px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-colors min-h-[44px] text-sm"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Confetti Effect
// ============================================

function ConfettiEffect() {
  const colors = ['#00f0ff', '#a855f7', '#f59e0b', '#22c55e', '#ec4899'];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}

// Helper
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
