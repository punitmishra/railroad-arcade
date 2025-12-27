'use client';

// ============================================
// Hardware Adapter Hook
// ============================================
// React hook for integrating hardware adapters with components.
// Handles mode switching, state subscriptions, and token enforcement.

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DemoAdapter, getDemoAdapter, resetDemoAdapter } from '@/lib/hardware/DemoAdapter';
import { LiveAdapter, getLiveAdapter, resetLiveAdapter } from '@/lib/hardware/LiveAdapter';
import {
  HardwareAdapter,
  LayoutState,
  TrainState,
  JunctionState,
  CrossingState,
  SignalState,
  SceneryState,
  SystemStatus,
  TrainDirection,
} from '@/lib/hardware/HardwareAdapter';
import { TokenGuard, formatActionCost, getActionDescription } from '@/lib/token-guard';
import { getActionCost } from '@/lib/pricing';

// ============================================
// Types
// ============================================

export interface UseHardwareAdapterOptions {
  mode: 'demo' | 'live';
  onTokenBalanceChange?: (balance: number) => void;
  onError?: (error: string) => void;
  onActionConfirmRequired?: (action: string, cost: number, onConfirm: () => void, onCancel: () => void) => void;
}

export interface HardwareAdapterState {
  trains: TrainState[];
  junctions: JunctionState[];
  crossings: CrossingState[];
  signals: SignalState[];
  scenery: SceneryState;
  system: SystemStatus;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface HardwareAdapterActions {
  // Train actions
  setTrainSpeed: (trackId: string, speed: number) => Promise<boolean>;
  setTrainDirection: (trackId: string, direction: TrainDirection) => Promise<boolean>;
  stopTrain: (trackId: string) => Promise<boolean>;
  toggleHeadlights: (trackId: string) => Promise<boolean>;
  emergencyStop: () => Promise<boolean>;

  // Junction actions
  toggleJunction: (id: string) => Promise<boolean>;
  setJunctionPosition: (id: string, position: 'straight' | 'diverge') => Promise<boolean>;

  // Crossing actions
  toggleCrossing: (id: string) => Promise<boolean>;
  setCrossingGate: (id: string, position: 'up' | 'down') => Promise<boolean>;

  // Scenery actions
  setScenery: (scenery: Partial<SceneryState>) => Promise<boolean>;

  // Sound
  playSound: (name: string) => Promise<boolean>;

  // Utilities
  getActionCost: (action: string) => number;
  formatActionCost: (action: string) => string;
  refreshState: () => Promise<void>;
}

export interface UseHardwareAdapterReturn {
  state: HardwareAdapterState;
  actions: HardwareAdapterActions;
  mode: 'demo' | 'live';
  adapter: HardwareAdapter | null;
}

// ============================================
// Default State
// ============================================

const DEFAULT_STATE: HardwareAdapterState = {
  trains: [],
  junctions: [],
  crossings: [],
  signals: [],
  scenery: {
    timeOfDay: 'day',
    weather: 'clear',
    season: 'summer',
    lightsOn: false,
  },
  system: {
    connected: false,
    tracksOnline: 0,
    cameraOnline: false,
    cpxOnline: false,
    lastUpdate: 0,
  },
  isConnected: false,
  isLoading: true,
  error: null,
};

// ============================================
// Hook Implementation
// ============================================

export function useHardwareAdapter(options: UseHardwareAdapterOptions): UseHardwareAdapterReturn {
  const { mode, onTokenBalanceChange, onError, onActionConfirmRequired } = options;

  const [state, setState] = useState<HardwareAdapterState>(DEFAULT_STATE);
  const adapterRef = useRef<HardwareAdapter | null>(null);
  const tokenGuardRef = useRef<TokenGuard | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize token guard
  useEffect(() => {
    tokenGuardRef.current = new TokenGuard({
      isLiveMode: mode === 'live',
      onBalanceChange: onTokenBalanceChange,
      onError,
    });
  }, [mode, onTokenBalanceChange, onError]);

  // Update token guard mode
  useEffect(() => {
    tokenGuardRef.current?.setLiveMode(mode === 'live');
  }, [mode]);

  // Initialize adapter based on mode
  useEffect(() => {
    // Cleanup previous adapter
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Get adapter for current mode
    const adapter = mode === 'demo' ? getDemoAdapter() : getLiveAdapter();
    adapterRef.current = adapter;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Subscribe to state updates
    if (adapter.subscribe) {
      unsubscribeRef.current = adapter.subscribe((layoutState: LayoutState) => {
        setState({
          trains: layoutState.trains,
          junctions: layoutState.junctions,
          crossings: layoutState.crossings,
          signals: layoutState.signals,
          scenery: layoutState.scenery,
          system: layoutState.system,
          isConnected: layoutState.system.connected,
          isLoading: false,
          error: null,
        });
      });
    } else {
      // Adapter doesn't support subscriptions - poll for state
      const fetchState = async () => {
        try {
          const [trains, junctions, crossings, signals, scenery, system] = await Promise.all([
            adapter.getTrains(),
            adapter.getJunctions(),
            adapter.getCrossings(),
            adapter.getSignals(),
            adapter.getScenery(),
            adapter.getStatus(),
          ]);

          setState({
            trains,
            junctions,
            crossings,
            signals,
            scenery,
            system,
            isConnected: system.connected,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isConnected: false,
            error: error instanceof Error ? error.message : 'Failed to fetch state',
          }));
        }
      };

      fetchState();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [mode]);

  // Helper to execute action with token enforcement
  const executeWithTokens = useCallback(
    async (actionName: string, executor: () => Promise<void>): Promise<boolean> => {
      const adapter = adapterRef.current;
      const tokenGuard = tokenGuardRef.current;

      if (!adapter || !tokenGuard) {
        onError?.('Adapter not initialized');
        return false;
      }

      // Check if action needs confirmation in live mode
      if (mode === 'live') {
        const cost = getActionCost(actionName);

        if (cost > 0 && onActionConfirmRequired) {
          // Request confirmation from user
          return new Promise((resolve) => {
            onActionConfirmRequired(
              actionName,
              cost,
              async () => {
                // User confirmed
                const result = await tokenGuard.executeAction(actionName, executor);
                resolve(result.success);
              },
              () => {
                // User cancelled
                resolve(false);
              }
            );
          });
        }
      }

      // Execute with token guard (handles demo mode automatically)
      const result = await tokenGuard.executeAction(actionName, executor);
      return result.success;
    },
    [mode, onError, onActionConfirmRequired]
  );

  // ============================================
  // Train Actions
  // ============================================

  const setTrainSpeed = useCallback(
    async (trackId: string, speed: number): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      // Determine action based on speed
      const currentTrain = state.trains.find((t) => t.trackId === trackId);
      const isStarting = currentTrain?.speed === 0 && speed > 0;
      const action = isStarting ? 'TRAIN_START' : 'TRAIN_STOP';

      // Only charge for starting, not speed changes
      if (isStarting) {
        return executeWithTokens(action, () => adapter.setTrainSpeed(trackId, speed));
      }

      // Speed changes are free
      try {
        await adapter.setTrainSpeed(trackId, speed);
        return true;
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Failed to set speed');
        return false;
      }
    },
    [state.trains, executeWithTokens, onError]
  );

  const setTrainDirection = useCallback(
    async (trackId: string, direction: TrainDirection): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      try {
        await adapter.setTrainDirection(trackId, direction);
        return true;
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Failed to set direction');
        return false;
      }
    },
    [onError]
  );

  const stopTrain = useCallback(
    async (trackId: string): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      // Stopping is free
      try {
        await adapter.stopTrain(trackId);
        return true;
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Failed to stop train');
        return false;
      }
    },
    [onError]
  );

  const toggleHeadlights = useCallback(
    async (trackId: string): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      try {
        await adapter.toggleHeadlights(trackId);
        return true;
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Failed to toggle headlights');
        return false;
      }
    },
    [onError]
  );

  const emergencyStop = useCallback(async (): Promise<boolean> => {
    const adapter = adapterRef.current;
    if (!adapter) return false;

    // Emergency stop is always free
    try {
      await adapter.emergencyStop();
      return true;
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Emergency stop failed');
      return false;
    }
  }, [onError]);

  // ============================================
  // Junction Actions
  // ============================================

  const toggleJunction = useCallback(
    async (id: string): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      return executeWithTokens('JUNCTION_SWITCH', () => adapter.toggleJunction(id));
    },
    [executeWithTokens]
  );

  const setJunctionPosition = useCallback(
    async (id: string, position: 'straight' | 'diverge'): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      return executeWithTokens('JUNCTION_SWITCH', () => adapter.setJunctionPosition(id, position));
    },
    [executeWithTokens]
  );

  // ============================================
  // Crossing Actions
  // ============================================

  const toggleCrossing = useCallback(
    async (id: string): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      return executeWithTokens('CROSSING_TOGGLE', () => adapter.toggleCrossing(id));
    },
    [executeWithTokens]
  );

  const setCrossingGate = useCallback(
    async (id: string, position: 'up' | 'down'): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      return executeWithTokens('CROSSING_TOGGLE', () => adapter.setCrossingGate(id, position));
    },
    [executeWithTokens]
  );

  // ============================================
  // Scenery Actions
  // ============================================

  const setScenery = useCallback(
    async (scenery: Partial<SceneryState>): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      return executeWithTokens('SCENERY_CHANGE', () => adapter.setScenery(scenery));
    },
    [executeWithTokens]
  );

  // ============================================
  // Sound
  // ============================================

  const playSound = useCallback(
    async (name: string): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      try {
        await adapter.playSound(name);
        return true;
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Failed to play sound');
        return false;
      }
    },
    [onError]
  );

  // ============================================
  // Utilities
  // ============================================

  const getActionCostForMode = useCallback(
    (action: string): number => {
      if (mode === 'demo') return 0;
      return getActionCost(action);
    },
    [mode]
  );

  const formatActionCostForMode = useCallback(
    (action: string): string => {
      return formatActionCost(action, mode === 'live');
    },
    [mode]
  );

  const refreshState = useCallback(async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const [trains, junctions, crossings, signals, scenery, system] = await Promise.all([
        adapter.getTrains(),
        adapter.getJunctions(),
        adapter.getCrossings(),
        adapter.getSignals(),
        adapter.getScenery(),
        adapter.getStatus(),
      ]);

      setState({
        trains,
        junctions,
        crossings,
        signals,
        scenery,
        system,
        isConnected: system.connected,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh state',
      }));
    }
  }, []);

  // ============================================
  // Return Value
  // ============================================

  const actions: HardwareAdapterActions = useMemo(
    () => ({
      setTrainSpeed,
      setTrainDirection,
      stopTrain,
      toggleHeadlights,
      emergencyStop,
      toggleJunction,
      setJunctionPosition,
      toggleCrossing,
      setCrossingGate,
      setScenery,
      playSound,
      getActionCost: getActionCostForMode,
      formatActionCost: formatActionCostForMode,
      refreshState,
    }),
    [
      setTrainSpeed,
      setTrainDirection,
      stopTrain,
      toggleHeadlights,
      emergencyStop,
      toggleJunction,
      setJunctionPosition,
      toggleCrossing,
      setCrossingGate,
      setScenery,
      playSound,
      getActionCostForMode,
      formatActionCostForMode,
      refreshState,
    ]
  );

  return {
    state,
    actions,
    mode,
    adapter: adapterRef.current,
  };
}

// ============================================
// Simplified Hooks
// ============================================

/**
 * Hook for train state only
 */
export function useTrainState(mode: 'demo' | 'live') {
  const { state, actions } = useHardwareAdapter({ mode });

  return {
    trains: state.trains,
    setSpeed: actions.setTrainSpeed,
    setDirection: actions.setTrainDirection,
    stop: actions.stopTrain,
    toggleHeadlights: actions.toggleHeadlights,
    emergencyStop: actions.emergencyStop,
  };
}

/**
 * Hook for layout state (junctions, crossings, signals)
 */
export function useLayoutState(mode: 'demo' | 'live') {
  const { state, actions } = useHardwareAdapter({ mode });

  return {
    junctions: state.junctions,
    crossings: state.crossings,
    signals: state.signals,
    toggleJunction: actions.toggleJunction,
    toggleCrossing: actions.toggleCrossing,
  };
}

/**
 * Hook for system status
 */
export function useSystemStatus(mode: 'demo' | 'live') {
  const { state } = useHardwareAdapter({ mode });

  return {
    status: state.system,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
  };
}
