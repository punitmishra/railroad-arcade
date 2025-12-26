'use client';

import { useState } from 'react';
import { useCheckpoints, CheckpointSummary, CheckpointData } from '@/hooks/useCheckpoints';
import { GameMode } from '@prisma/client';

// ============================================
// Checkpoint List Component
// ============================================

interface CheckpointListProps {
  gameMode?: GameMode;
  onLoad?: (checkpoint: CheckpointData) => void;
  onSave?: () => {
    gameMode: GameMode;
    score: number;
    timeRemaining?: number;
    timeElapsed: number;
    trainStates: Record<string, { track: number; position: number; speed: number; direction: 'forward' | 'reverse' }>;
    junctionStates: Record<string, { thrown: boolean }>;
    crossingStates: Record<string, { active: boolean }>;
  } | null;
  className?: string;
}

export function CheckpointList({ gameMode, onLoad, onSave, className = '' }: CheckpointListProps) {
  const { checkpoints, loading, error, saveCheckpoint, loadCheckpoint, deleteCheckpoint, refresh } = useCheckpoints({
    gameMode,
    autoLoad: true,
  });

  const [savingName, setSavingName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!onSave) return;

    const gameState = onSave();
    if (!gameState) return;

    const result = await saveCheckpoint({
      name: savingName || undefined,
      ...gameState,
    });

    if (result) {
      setShowSaveDialog(false);
      setSavingName('');
    }
  };

  const handleLoad = async (checkpoint: CheckpointSummary) => {
    if (!onLoad) return;

    setLoadingId(checkpoint.id);
    const fullCheckpoint = await loadCheckpoint(checkpoint.id);
    setLoadingId(null);

    if (fullCheckpoint) {
      onLoad(fullCheckpoint);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteCheckpoint(id);
    setDeletingId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getGameModeLabel = (mode: GameMode) => {
    const labels: Record<GameMode, string> = {
      FREE_PLAY: 'Free Play',
      DELIVERY_MISSION: 'Delivery',
      SPEED_RUN: 'Speed Run',
      SURVIVAL: 'Survival',
      TIME_ATTACK: 'Time Attack',
    };
    return labels[mode] || mode;
  };

  const getGameModeColor = (mode: GameMode) => {
    const colors: Record<GameMode, string> = {
      FREE_PLAY: 'bg-gray-500/20 text-gray-400',
      DELIVERY_MISSION: 'bg-amber-500/20 text-amber-400',
      SPEED_RUN: 'bg-cyan-500/20 text-cyan-400',
      SURVIVAL: 'bg-red-500/20 text-red-400',
      TIME_ATTACK: 'bg-purple-500/20 text-purple-400',
    };
    return colors[mode] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className={`bg-[#12121c] rounded-xl border border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h3 className="font-semibold text-white">Checkpoints</h3>
          <span className="text-xs text-gray-500">({checkpoints.length}/5)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            title="Refresh"
            aria-label="Refresh checkpoints"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {onSave && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 active:bg-cyan-500/40 transition-colors text-sm min-h-[36px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-xs text-cyan-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && checkpoints.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="text-gray-500 text-sm">No saved checkpoints</p>
            {onSave && (
              <p className="text-gray-600 text-xs mt-1">Save your progress to resume later</p>
            )}
          </div>
        )}

        {!loading && !error && checkpoints.length > 0 && (
          <div className="space-y-2">
            {checkpoints.map((checkpoint) => (
              <div
                key={checkpoint.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm truncate">{checkpoint.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${getGameModeColor(checkpoint.gameMode)}`}>
                      {getGameModeLabel(checkpoint.gameMode)}
                    </span>
                    {checkpoint.isLive && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>Score: {checkpoint.score.toLocaleString()}</span>
                    <span>Time: {formatTime(checkpoint.timeElapsed)}</span>
                    <span className="hidden sm:inline">{formatDate(checkpoint.updatedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {onLoad && (
                    <button
                      onClick={() => handleLoad(checkpoint)}
                      disabled={loadingId === checkpoint.id}
                      className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-colors disabled:opacity-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                      title="Load checkpoint"
                      aria-label="Load checkpoint"
                    >
                      {loadingId === checkpoint.id ? (
                        <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(checkpoint.id)}
                    disabled={deletingId === checkpoint.id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20 active:bg-red-500/30 transition-colors disabled:opacity-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    title="Delete checkpoint"
                    aria-label="Delete checkpoint"
                  >
                    {deletingId === checkpoint.id ? (
                      <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="bg-[#12121c] rounded-t-xl sm:rounded-xl border border-white/10 p-4 w-full sm:max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-white mb-4">Save Checkpoint</h3>
            <input
              type="text"
              value={savingName}
              onChange={(e) => setSavingName(e.target.value)}
              placeholder="Checkpoint name (optional)"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 active:bg-white/15 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 active:bg-cyan-700 transition-colors min-h-[44px]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Compact Checkpoint Button (for inline use)
// ============================================

interface CheckpointButtonProps {
  onClick: () => void;
  hasCheckpoints?: boolean;
  className?: string;
}

export function CheckpointButton({ onClick, hasCheckpoints, className = '' }: CheckpointButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white active:bg-white/15 transition-colors ${className}`}
      title="Checkpoints"
      aria-label="Open checkpoints"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      <span className="text-sm">Checkpoints</span>
      {hasCheckpoints && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-500" />
      )}
    </button>
  );
}
