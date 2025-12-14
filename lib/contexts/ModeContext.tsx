'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============================================
// Types
// ============================================

export type GameModeType = 'demo' | 'live';

export interface LiveConnectionStatus {
  connected: boolean;
  lastPing: number | null;
  latency: number | null;
  error: string | null;
}

export interface QueuePosition {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // seconds
  controlEndsAt: Date | null;
  isActive: boolean;
}

interface ModeContextValue {
  // Mode state
  mode: GameModeType;
  setMode: (mode: GameModeType) => void;
  toggleMode: () => void;

  // Live connection
  liveConnection: LiveConnectionStatus;
  checkConnection: () => Promise<boolean>;

  // Queue state (for live mode)
  queuePosition: QueuePosition | null;
  setQueuePosition: (position: QueuePosition | null) => void;
  hasLiveControl: boolean;

  // Token requirements
  isTokenRequired: boolean;

  // Helpers
  canControlHardware: boolean;
  isViewOnly: boolean;
}

// ============================================
// Context
// ============================================

const ModeContext = createContext<ModeContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface ModeProviderProps {
  children: ReactNode;
  defaultMode?: GameModeType;
}

export function ModeProvider({ children, defaultMode = 'demo' }: ModeProviderProps) {
  const [mode, setMode] = useState<GameModeType>(defaultMode);
  const [liveConnection, setLiveConnection] = useState<LiveConnectionStatus>({
    connected: false,
    lastPing: null,
    latency: null,
    error: null,
  });
  const [queuePosition, setQueuePosition] = useState<QueuePosition | null>(null);

  // Check if user has active live control
  const hasLiveControl = queuePosition?.isActive ?? false;

  // Can control hardware only in live mode with active control
  const canControlHardware = mode === 'live' && hasLiveControl;

  // In demo mode, or in live mode without active control, user is view-only for live feed
  const isViewOnly = mode === 'demo' || (mode === 'live' && !hasLiveControl);

  // Token is required for live mode actions
  const isTokenRequired = mode === 'live';

  // Toggle between demo and live modes
  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'demo' ? 'live' : 'demo'));
  }, []);

  // Check live connection to Raspberry Pi
  const checkConnection = useCallback(async (): Promise<boolean> => {
    const startTime = Date.now();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        setLiveConnection({
          connected: true,
          lastPing: Date.now(),
          latency,
          error: null,
        });
        return true;
      } else {
        setLiveConnection({
          connected: false,
          lastPing: Date.now(),
          latency: null,
          error: `Server returned ${response.status}`,
        });
        return false;
      }
    } catch (error) {
      setLiveConnection({
        connected: false,
        lastPing: Date.now(),
        latency: null,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      return false;
    }
  }, []);

  // Ping connection periodically when in live mode
  useEffect(() => {
    if (mode === 'live') {
      checkConnection();
      const interval = setInterval(checkConnection, 10000); // Every 10 seconds
      return () => clearInterval(interval);
    }
  }, [mode, checkConnection]);

  const value: ModeContextValue = {
    mode,
    setMode,
    toggleMode,
    liveConnection,
    checkConnection,
    queuePosition,
    setQueuePosition,
    hasLiveControl,
    isTokenRequired,
    canControlHardware,
    isViewOnly,
  };

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

// ============================================
// Hooks
// ============================================

export function useGameMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useGameMode must be used within a ModeProvider');
  }
  return context;
}

export function useLiveConnection() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useLiveConnection must be used within a ModeProvider');
  }
  return {
    status: context.liveConnection,
    check: context.checkConnection,
    isConnected: context.liveConnection.connected,
  };
}

export function useQueuePosition() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useQueuePosition must be used within a ModeProvider');
  }
  return {
    position: context.queuePosition,
    setPosition: context.setQueuePosition,
    hasControl: context.hasLiveControl,
  };
}
