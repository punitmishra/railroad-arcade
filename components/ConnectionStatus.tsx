'use client';

// ============================================
// Connection Status Component
// ============================================
// Real-time connection status indicator showing
// latency, sync status, and connection quality.

import { useState, useEffect } from 'react';

// ============================================
// Types
// ============================================

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface ConnectionStatusProps {
  mode: 'demo' | 'live';
  isConnected?: boolean;
  latency?: number;
  lastSync?: Date | null;
  isSyncing?: boolean;
  pendingActions?: number;
  onReconnect?: () => void;
  className?: string;
  compact?: boolean;
}

// ============================================
// Helper Functions
// ============================================

function getConnectionQuality(latency: number | undefined, isConnected: boolean): ConnectionQuality {
  if (!isConnected) return 'offline';
  if (latency === undefined) return 'good';
  if (latency < 100) return 'excellent';
  if (latency < 300) return 'good';
  return 'poor';
}

function getQualityColor(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent': return 'text-emerald-400';
    case 'good': return 'text-cyan-400';
    case 'poor': return 'text-amber-400';
    case 'offline': return 'text-red-400';
  }
}

function getQualityBgColor(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent': return 'bg-emerald-500';
    case 'good': return 'bg-cyan-500';
    case 'poor': return 'bg-amber-500';
    case 'offline': return 'bg-red-500';
  }
}

function getQualityLabel(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'poor': return 'Poor';
    case 'offline': return 'Offline';
  }
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return 'Over 1h ago';
}

// ============================================
// Signal Bars Component
// ============================================

function SignalBars({ quality }: { quality: ConnectionQuality }) {
  const bars = quality === 'excellent' ? 4 : quality === 'good' ? 3 : quality === 'poor' ? 2 : 0;

  return (
    <div className="flex items-end gap-0.5 h-3">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`w-1 rounded-sm transition-all duration-300 ${
            bar <= bars
              ? getQualityBgColor(quality)
              : 'bg-white/20'
          }`}
          style={{ height: `${bar * 25}%` }}
        />
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ConnectionStatus({
  mode,
  isConnected = true,
  latency,
  lastSync,
  isSyncing = false,
  pendingActions = 0,
  onReconnect,
  className = '',
  compact = false,
}: ConnectionStatusProps) {
  const [expanded, setExpanded] = useState(false);
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(lastSync ?? null));

  const quality = getConnectionQuality(latency, isConnected);
  const qualityColor = getQualityColor(quality);
  const qualityLabel = getQualityLabel(quality);

  // Update relative time every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(lastSync ?? null));
    }, 10000);
    return () => clearInterval(interval);
  }, [lastSync]);

  // Demo mode - simplified display
  if (mode === 'demo') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs font-medium text-purple-300">Demo Mode</span>
        </div>
      </div>
    );
  }

  // Compact mode - just the indicator
  if (compact) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className={`relative flex items-center gap-1.5 px-2 py-1 rounded-full transition-all
          ${isConnected
            ? 'bg-white/5 hover:bg-white/10'
            : 'bg-red-500/20 hover:bg-red-500/30'
          } ${className}`}
        aria-label={`Connection status: ${qualityLabel}`}
      >
        <div className={`w-2 h-2 rounded-full ${getQualityBgColor(quality)} ${isConnected ? 'animate-pulse' : ''}`} />
        {latency !== undefined && isConnected && (
          <span className={`text-xs font-mono ${qualityColor}`}>{latency}ms</span>
        )}
        {isSyncing && (
          <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
        )}
        {pendingActions > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-amber-500 text-black rounded-full">
            {pendingActions}
          </span>
        )}
      </button>
    );
  }

  // Full display
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all border
          ${isConnected
            ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
          }`}
        aria-expanded={expanded}
        aria-label="Toggle connection details"
      >
        {/* Status Dot */}
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full ${getQualityBgColor(quality)}`} />
          {isConnected && (
            <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${getQualityBgColor(quality)} animate-ping opacity-75`} />
          )}
        </div>

        {/* Signal Bars */}
        <SignalBars quality={quality} />

        {/* Latency */}
        {latency !== undefined && isConnected && (
          <span className={`text-sm font-mono ${qualityColor}`}>
            {latency}ms
          </span>
        )}

        {/* Status Text */}
        <span className={`text-sm ${qualityColor}`}>
          {isConnected ? qualityLabel : 'Offline'}
        </span>

        {/* Syncing Indicator */}
        {isSyncing && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-cyan-400">Syncing</span>
          </div>
        )}

        {/* Pending Actions Badge */}
        {pendingActions > 0 && (
          <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-black rounded">
            {pendingActions} pending
          </span>
        )}

        {/* Expand Arrow */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Details Panel */}
      {expanded && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl bg-[#1a1a2e] border border-white/10 shadow-xl z-50 min-w-[220px]">
          <div className="space-y-3">
            {/* Connection Quality */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Quality</span>
              <span className={`text-sm font-medium ${qualityColor}`}>{qualityLabel}</span>
            </div>

            {/* Latency */}
            {latency !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Latency</span>
                <span className={`text-sm font-mono ${qualityColor}`}>{latency}ms</span>
              </div>
            )}

            {/* Last Sync */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Last Sync</span>
              <span className="text-sm text-gray-300">{relativeTime}</span>
            </div>

            {/* Pending Actions */}
            {pendingActions > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Pending</span>
                <span className="text-sm text-amber-400">{pendingActions} actions</span>
              </div>
            )}

            {/* Reconnect Button */}
            {!isConnected && onReconnect && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReconnect();
                }}
                className="w-full mt-2 px-3 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
              >
                Reconnect
              </button>
            )}

            {/* Sync Status */}
            {isSyncing && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-cyan-400">Synchronizing...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Exports
// ============================================

export default ConnectionStatus;
