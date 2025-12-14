'use client';

import { useState } from 'react';
import { useGameMode } from '@/lib/contexts/ModeContext';
import { GAME_MODE_CONFIGS, GameModeId } from '@/lib/game-modes/GameModeEngine';
import { ArcadeButton } from '@/components/ui';

// ============================================
// Types
// ============================================

interface GameModeSelectorProps {
  onSelectMode: (modeId: GameModeId) => void;
  currentMode?: GameModeId | null;
}

// ============================================
// Game Mode Selector Component
// ============================================

export function GameModeSelector({ onSelectMode, currentMode }: GameModeSelectorProps) {
  const { mode: appMode } = useGameMode();
  const [selectedMode, setSelectedMode] = useState<GameModeId>(currentMode ?? 'FREE_PLAY');

  const modes = Object.values(GAME_MODE_CONFIGS).filter((config) => {
    if (appMode === 'demo') return config.availableInDemo;
    return config.availableInLive;
  });

  const handleStart = () => {
    onSelectMode(selectedMode);
  };

  return (
    <div className="bg-[#12121c] rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-b border-white/10">
        <h3 className="font-semibold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Select Game Mode
        </h3>
      </div>

      <div className="p-4 space-y-3">
        {modes.map((config) => (
          <button
            key={config.id}
            onClick={() => setSelectedMode(config.id)}
            className={`
              w-full p-4 rounded-lg border text-left transition-all
              ${selectedMode === config.id
                ? 'border-cyan-500/50 bg-cyan-500/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white">{config.name}</span>
              <div className="flex items-center gap-2">
                {config.duration && (
                  <span className="text-xs text-gray-400 px-2 py-0.5 rounded bg-white/5">
                    {Math.floor(config.duration / 60)}:{(config.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
                {config.tokenCost > 0 ? (
                  <span className="text-xs text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">
                    {config.tokenCost} tokens
                  </span>
                ) : (
                  <span className="text-xs text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                    Free
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-400">{config.description}</p>
            {config.objectives.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <span className="text-xs text-gray-500">Objectives:</span>
                <ul className="mt-1 space-y-0.5">
                  {config.objectives.map((obj) => (
                    <li key={obj.id} className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-cyan-400" />
                      {obj.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </button>
        ))}

        <ArcadeButton
          variant="primary"
          className="w-full mt-4"
          onClick={handleStart}
        >
          Start {GAME_MODE_CONFIGS[selectedMode].name}
        </ArcadeButton>
      </div>
    </div>
  );
}

// ============================================
// Game Mode Card (compact)
// ============================================

interface GameModeCardProps {
  modeId: GameModeId;
  onClick: () => void;
  isSelected?: boolean;
}

export function GameModeCard({ modeId, onClick, isSelected }: GameModeCardProps) {
  const config = GAME_MODE_CONFIGS[modeId];

  return (
    <button
      onClick={onClick}
      className={`
        p-3 rounded-lg border text-left transition-all
        ${isSelected
          ? 'border-cyan-500/50 bg-cyan-500/10'
          : 'border-white/10 hover:border-white/20'
        }
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-white text-sm">{config.name}</span>
        {config.tokenCost > 0 ? (
          <span className="text-[10px] text-amber-400">{config.tokenCost}t</span>
        ) : (
          <span className="text-[10px] text-emerald-400">Free</span>
        )}
      </div>
      <p className="text-xs text-gray-500 line-clamp-2">{config.description}</p>
    </button>
  );
}
