'use client';

import { useGameMode, useLiveConnection } from '@/lib/contexts/ModeContext';

// ============================================
// Mode Toggle Component
// ============================================
// Toggle between Demo and Live modes with visual
// status indicators.

export function ModeToggle() {
  const { mode, toggleMode, liveConnection } = useGameMode();
  const { isConnected } = useLiveConnection();

  return (
    <div className="flex items-center gap-2">
      {/* Mode Toggle Switch */}
      <button
        onClick={toggleMode}
        className={`
          relative flex items-center gap-1 px-3 py-1.5 rounded-full
          transition-all duration-300 text-sm font-medium
          ${mode === 'demo'
            ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/40 text-purple-300'
            : 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300'
          }
        `}
      >
        {/* Demo/Live Label */}
        <span className="relative z-10 flex items-center gap-1.5">
          {mode === 'demo' ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              DEMO
            </>
          ) : (
            <>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              LIVE
            </>
          )}
        </span>
      </button>

      {/* Connection Status (only show in live mode) */}
      {mode === 'live' && (
        <div className={`
          flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs
          ${isConnected
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-red-500/10 text-red-400'
          }
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {isConnected ? 'Connected' : 'Offline'}
          {liveConnection.latency && isConnected && (
            <span className="text-gray-500 ml-1">{liveConnection.latency}ms</span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Mode Badge Component
// ============================================
// Shows current mode as a small badge.

export function ModeBadge() {
  const { mode } = useGameMode();

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
      ${mode === 'demo'
        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
      }
    `}>
      {mode === 'demo' ? (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
          Demo
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </>
      )}
    </span>
  );
}

// ============================================
// View Only Badge Component
// ============================================
// Shows when user is viewing live feed without control.

export function ViewOnlyBadge() {
  const { isViewOnly, mode } = useGameMode();

  if (!isViewOnly || mode === 'demo') return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      View Only - Join Queue to Control
    </div>
  );
}

// ============================================
// Mode Info Panel Component
// ============================================
// Explains the difference between Demo and Live modes.

export function ModeInfoPanel({ onClose }: { onClose?: () => void }) {
  return (
    <div className="bg-[#12121c] rounded-xl border border-white/10 p-6 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Game Modes
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Demo Mode */}
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-purple-300">Demo Mode</span>
            <span className="ml-auto text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">FREE</span>
          </div>
          <p className="text-sm text-gray-400">
            Play with a realistic simulation of the railroad. All features available,
            no tokens required. Perfect for learning the controls!
          </p>
        </div>

        {/* Live Mode */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-300">Live Mode</span>
            <span className="ml-auto text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">TOKENS</span>
          </div>
          <p className="text-sm text-gray-400">
            Control the real trains on our physical railroad! Join the queue,
            spend tokens, and experience the thrill of real hardware control.
          </p>
          <ul className="mt-2 text-xs text-gray-500 space-y-1">
            <li>• Queue-based access for fair turns</li>
            <li>• Time-based or per-action pricing</li>
            <li>• Watch live feed while waiting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
