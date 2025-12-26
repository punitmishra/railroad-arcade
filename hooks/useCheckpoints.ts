'use client';

import { useState, useCallback, useEffect } from 'react';
import { GameMode } from '@prisma/client';

export interface TrainState {
  track: number;
  position: number;
  speed: number;
  direction: 'forward' | 'reverse';
}

export interface JunctionState {
  thrown: boolean;
}

export interface CrossingState {
  active: boolean;
}

export interface CheckpointData {
  id: string;
  name: string;
  gameMode: GameMode;
  isLive: boolean;
  score: number;
  timeRemaining: number | null;
  timeElapsed: number;
  trainStates: Record<string, TrainState>;
  junctionStates: Record<string, JunctionState>;
  crossingStates: Record<string, CrossingState>;
  objectives?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CheckpointSummary {
  id: string;
  name: string;
  gameMode: GameMode;
  isLive: boolean;
  score: number;
  timeRemaining: number | null;
  timeElapsed: number;
  createdAt: string;
  updatedAt: string;
}

interface UseCheckpointsOptions {
  gameMode?: GameMode;
  autoLoad?: boolean;
}

export function useCheckpoints(options: UseCheckpointsOptions = {}) {
  const [checkpoints, setCheckpoints] = useState<CheckpointSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch checkpoints list
  const fetchCheckpoints = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.gameMode) {
        params.set('gameMode', options.gameMode);
      }

      const response = await fetch(`/api/checkpoints?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch checkpoints');
      }

      const data = await response.json();
      setCheckpoints(data.checkpoints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [options.gameMode]);

  // Load on mount if autoLoad is true
  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchCheckpoints();
    }
  }, [fetchCheckpoints, options.autoLoad]);

  // Save a new checkpoint
  const saveCheckpoint = useCallback(async (data: {
    name?: string;
    gameMode: GameMode;
    isLive?: boolean;
    score?: number;
    timeRemaining?: number;
    timeElapsed?: number;
    trainStates: Record<string, TrainState>;
    junctionStates: Record<string, JunctionState>;
    crossingStates: Record<string, CrossingState>;
    objectives?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<CheckpointData | null> => {
    try {
      const response = await fetch('/api/checkpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save checkpoint');
      }

      const result = await response.json();

      // Refresh the list
      await fetchCheckpoints();

      return result.checkpoint;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      return null;
    }
  }, [fetchCheckpoints]);

  // Load a checkpoint by ID
  const loadCheckpoint = useCallback(async (id: string): Promise<CheckpointData | null> => {
    try {
      const response = await fetch(`/api/checkpoints/${id}`);

      if (!response.ok) {
        throw new Error('Checkpoint not found');
      }

      const data = await response.json();
      return data.checkpoint;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      return null;
    }
  }, []);

  // Update an existing checkpoint
  const updateCheckpoint = useCallback(async (
    id: string,
    data: Partial<{
      name: string;
      score: number;
      timeRemaining: number;
      timeElapsed: number;
      trainStates: Record<string, TrainState>;
      junctionStates: Record<string, JunctionState>;
      crossingStates: Record<string, CrossingState>;
      objectives: Record<string, unknown>;
      metadata: Record<string, unknown>;
    }>
  ): Promise<CheckpointData | null> => {
    try {
      const response = await fetch(`/api/checkpoints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update checkpoint');
      }

      const result = await response.json();

      // Refresh the list
      await fetchCheckpoints();

      return result.checkpoint;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
      return null;
    }
  }, [fetchCheckpoints]);

  // Delete a checkpoint
  const deleteCheckpoint = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/checkpoints?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete checkpoint');
      }

      // Refresh the list
      await fetchCheckpoints();

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      return false;
    }
  }, [fetchCheckpoints]);

  return {
    checkpoints,
    loading,
    error,
    saveCheckpoint,
    loadCheckpoint,
    updateCheckpoint,
    deleteCheckpoint,
    refresh: fetchCheckpoints,
  };
}
