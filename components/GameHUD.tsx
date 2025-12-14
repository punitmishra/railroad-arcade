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
    <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40 pointer-events-none">
      <div className="bg-[#0a0a0f]/95 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-white/10 flex items-center justify-between">
          <span className="text-sm font-medium text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {gameState.mode.replace('_', ' ')}
          </span>
          <div className="flex items-center gap-2">
            {gameState.isPaused ? (
              <button
                onClick={onResume}
                className="p-1 rounded hover:bg-white/10 text-emerald-400"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="p-1 rounded hover:bg-white/10 text-amber-400"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
            )}
            <button
              onClick={onEnd}
              className="p-1 rounded hover:bg-white/10 text-red-400"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Score and Time */}
          <div className="flex items-center justify-between">
            {/* Score */}
            <div>
              <div className="text-3xl font-bold text-white font-mono">
                {gameState.score.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">SCORE</div>
            </div>

            {/* Multiplier */}
            {gameState.multiplier > 1 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  x{gameState.multiplier.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">COMBO</div>
              </div>
            )}

            {/* Time */}
            <div className="text-right">
              <div className={`text-2xl font-bold font-mono ${
                gameState.remainingTime !== null && gameState.remainingTime <= 30
                  ? 'text-red-400 animate-pulse'
                  : 'text-cyan-400'
              }`}>
                {gameState.remainingTime !== null
                  ? formatTime(gameState.remainingTime)
                  : formatTime(gameState.elapsedTime)
                }
              </div>
              <div className="text-xs text-gray-500">
                {gameState.remainingTime !== null ? 'REMAINING' : 'ELAPSED'}
              </div>
            </div>
          </div>

          {/* Objectives */}
          {gameState.objectives.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <div className="text-xs text-gray-500 mb-2">OBJECTIVES</div>
              <div className="space-y-2">
                {gameState.objectives.map((obj) => (
                  <div key={obj.id} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      obj.completed ? 'bg-emerald-500' : 'bg-white/10'
                    }`}>
                      {obj.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 text-sm text-gray-300">{obj.description}</div>
                    <div className="text-sm text-gray-500 font-mono">
                      {obj.current}/{obj.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Events */}
          {gameState.recentEvents.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <div className="text-xs text-gray-500 mb-2">RECENT</div>
              <div className="space-y-1 max-h-24 overflow-hidden">
                {gameState.recentEvents.slice(0, 3).map((event, index) => (
                  <ScorePopup key={`${event.timestamp}-${index}`} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-white font-mono">{gameState.stats.lapsCompleted}</div>
              <div className="text-[10px] text-gray-500">LAPS</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono">{gameState.stats.topSpeed}</div>
              <div className="text-[10px] text-gray-500">TOP SPD</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono">{gameState.stats.nearMisses}</div>
              <div className="text-[10px] text-gray-500">CLOSE</div>
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
  onPlayAgain: () => void;
  onExit: () => void;
}

export function GameOverScreen({ gameState, onPlayAgain, onExit }: GameOverProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#12121c] rounded-2xl border border-white/10 p-8 max-w-md w-full mx-4 text-center">
        <h2
          className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          GAME OVER
        </h2>
        <p className="text-gray-400 mb-6">{gameState.mode.replace('_', ' ')}</p>

        {/* Final Score */}
        <div className="mb-8">
          <div className="text-6xl font-bold text-white font-mono mb-2">
            {gameState.score.toLocaleString()}
          </div>
          <div className="text-gray-500">FINAL SCORE</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-cyan-400 font-mono">
              {gameState.stats.lapsCompleted}
            </div>
            <div className="text-xs text-gray-500">Laps</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {gameState.stats.topSpeed}
            </div>
            <div className="text-xs text-gray-500">Top Speed</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-purple-400 font-mono">
              {formatTime(gameState.elapsedTime)}
            </div>
            <div className="text-xs text-gray-500">Time</div>
          </div>
        </div>

        {/* Objectives */}
        {gameState.objectives.length > 0 && (
          <div className="mb-8">
            <div className="text-xs text-gray-500 mb-2">OBJECTIVES</div>
            <div className="space-y-2">
              {gameState.objectives.map((obj) => (
                <div
                  key={obj.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    obj.completed ? 'bg-emerald-500/10' : 'bg-white/5'
                  }`}
                >
                  <span className={obj.completed ? 'text-emerald-400' : 'text-gray-400'}>
                    {obj.description}
                  </span>
                  <span className={`font-mono ${obj.completed ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {obj.current}/{obj.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
          >
            Exit
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
