'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameMode } from '@/lib/contexts/ModeContext';
import { HardwareAdapter, LayoutState, TrainState } from '@/lib/hardware/HardwareAdapter';
import { getDemoAdapter, resetDemoAdapter } from '@/lib/hardware/DemoAdapter';
import { getLiveAdapter, resetLiveAdapter } from '@/lib/hardware/LiveAdapter';

// ============================================
// Hook: useHardware
// ============================================
// Provides the appropriate hardware adapter based on
// the current game mode (demo or live).

export function useHardware() {
  const { mode, canControlHardware, isViewOnly } = useGameMode();
  const [layoutState, setLayoutState] = useState<LayoutState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the appropriate adapter based on mode
  const adapter = useMemo<HardwareAdapter>(() => {
    if (mode === 'demo') {
      return getDemoAdapter();
    } else {
      return getLiveAdapter();
    }
  }, [mode]);

  // Subscribe to state updates
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = adapter.subscribe?.((state) => {
      setLayoutState(state);
      setIsLoading(false);
    });

    // If no subscription, poll manually
    if (!unsubscribe) {
      const loadState = async () => {
        try {
          const [trains, junctions, crossings, signals, scenery, system] = await Promise.all([
            adapter.getTrains(),
            adapter.getJunctions(),
            adapter.getCrossings(),
            adapter.getSignals(),
            adapter.getScenery(),
            adapter.getStatus(),
          ]);
          setLayoutState({ trains, junctions, crossings, signals, scenery, system });
          setIsLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load state');
          setIsLoading(false);
        }
      };
      loadState();
    }

    return () => {
      unsubscribe?.();
    };
  }, [adapter]);

  // Reset adapter when mode changes
  useEffect(() => {
    return () => {
      if (mode === 'demo') {
        // Don't reset demo adapter on unmount to preserve state
      } else {
        // Reset live adapter to clean up connections
        resetLiveAdapter();
      }
    };
  }, [mode]);

  // ============================================
  // Control Methods (with permission checks)
  // ============================================

  const setTrainSpeed = useCallback(
    async (trackId: number, speed: number) => {
      if (mode === 'live' && !canControlHardware) {
        console.warn('Cannot control hardware: not in active live session');
        return;
      }
      await adapter.setTrainSpeed(trackId, speed);
    },
    [adapter, mode, canControlHardware]
  );

  const setTrainDirection = useCallback(
    async (trackId: number, direction: 'forward' | 'reverse' | 'stopped') => {
      if (mode === 'live' && !canControlHardware) {
        console.warn('Cannot control hardware: not in active live session');
        return;
      }
      await adapter.setTrainDirection(trackId, direction);
    },
    [adapter, mode, canControlHardware]
  );

  const stopTrain = useCallback(
    async (trackId: number) => {
      if (mode === 'live' && !canControlHardware) {
        console.warn('Cannot control hardware: not in active live session');
        return;
      }
      await adapter.stopTrain(trackId);
    },
    [adapter, mode, canControlHardware]
  );

  const emergencyStop = useCallback(async () => {
    // Emergency stop is always allowed
    await adapter.emergencyStop();
  }, [adapter]);

  const toggleHeadlights = useCallback(
    async (trackId: number) => {
      if (mode === 'live' && !canControlHardware) {
        console.warn('Cannot control hardware: not in active live session');
        return;
      }
      await adapter.toggleHeadlights(trackId);
    },
    [adapter, mode, canControlHardware]
  );

  const toggleJunction = useCallback(
    async (id: string) => {
      if (mode === 'live' && !canControlHardware) {
        console.warn('Cannot control hardware: not in active live session');
        return;
      }
      await adapter.toggleJunction(id);
    },
    [adapter, mode, canControlHardware]
  );

  const toggleCrossing = useCallback(
    async (id: string) => {
      if (mode === 'live' && !canControlHardware) {
        console.warn('Cannot control hardware: not in active live session');
        return;
      }
      await adapter.toggleCrossing(id);
    },
    [adapter, mode, canControlHardware]
  );

  const setScenery = useCallback(
    async (scenery: Parameters<HardwareAdapter['setScenery']>[0]) => {
      if (mode === 'live' && !canControlHardware) {
        console.warn('Cannot control hardware: not in active live session');
        return;
      }
      await adapter.setScenery(scenery);
    },
    [adapter, mode, canControlHardware]
  );

  const playSound = useCallback(
    async (name: string) => {
      if (mode === 'live' && !canControlHardware) {
        console.warn('Cannot control hardware: not in active live session');
        return;
      }
      await adapter.playSound(name);
    },
    [adapter, mode, canControlHardware]
  );

  return {
    // State
    layoutState,
    trains: layoutState?.trains ?? [],
    junctions: layoutState?.junctions ?? [],
    crossings: layoutState?.crossings ?? [],
    signals: layoutState?.signals ?? [],
    scenery: layoutState?.scenery ?? null,
    system: layoutState?.system ?? null,

    // Status
    isLoading,
    error,
    isConnected: layoutState?.system?.connected ?? false,
    isViewOnly,
    canControl: mode === 'demo' || canControlHardware,

    // Control methods
    setTrainSpeed,
    setTrainDirection,
    stopTrain,
    emergencyStop,
    toggleHeadlights,
    toggleJunction,
    toggleCrossing,
    setScenery,
    playSound,

    // Raw adapter access (for advanced usage)
    adapter,
  };
}

// ============================================
// Hook: useTrain
// ============================================
// Convenience hook for controlling a single train.

export function useTrain(trackId: number) {
  const hardware = useHardware();
  const train = hardware.trains.find((t) => t.trackId === trackId);

  const setSpeed = useCallback(
    (speed: number) => hardware.setTrainSpeed(trackId, speed),
    [hardware, trackId]
  );

  const setDirection = useCallback(
    (direction: 'forward' | 'reverse' | 'stopped') =>
      hardware.setTrainDirection(trackId, direction),
    [hardware, trackId]
  );

  const stop = useCallback(() => hardware.stopTrain(trackId), [hardware, trackId]);

  const toggleLights = useCallback(
    () => hardware.toggleHeadlights(trackId),
    [hardware, trackId]
  );

  return {
    train,
    isLoading: hardware.isLoading,
    canControl: hardware.canControl,
    setSpeed,
    setDirection,
    stop,
    toggleLights,
  };
}
