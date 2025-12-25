'use client';

// ============================================
// Snapshots Hook
// ============================================
// React hook for fetching and managing snapshot data

import { useState, useEffect, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface Snapshot {
  id: string;
  timestamp: Date;
  thumbnail: string;
  fullUrl: string;
  camera: string;
  trainId?: string;
  trainName?: string;
  level: 1 | 2;
  liked: boolean;
  tags: string[];
  description?: string;
}

export interface SnapshotStats {
  total: number;
  liked: number;
  level1: number;
  level2: number;
}

export interface CreateSnapshotData {
  url: string;
  thumbnail?: string;
  camera: string;
  trainId?: string;
  trainName?: string;
  level: number;
  sessionId?: string;
  description?: string;
  tags?: string[];
}

export type SnapshotFilter = 'all' | 'liked' | 'level1' | 'level2';

export interface UseSnapshotsOptions {
  filter?: SnapshotFilter;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseSnapshotsReturn {
  snapshots: Snapshot[];
  stats: SnapshotStats;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createSnapshot: (data: CreateSnapshotData) => Promise<Snapshot | null>;
  toggleLike: (id: string) => Promise<boolean>;
  updateSnapshot: (id: string, data: { description?: string; tags?: string[] }) => Promise<boolean>;
  deleteSnapshot: (id: string) => Promise<boolean>;
}

// ============================================
// Hook Implementation
// ============================================

export function useSnapshots(options: UseSnapshotsOptions = {}): UseSnapshotsReturn {
  const { filter = 'all', limit = 50, autoFetch = true } = options;

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [stats, setStats] = useState<SnapshotStats>({ total: 0, liked: 0, level1: 0, level2: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch snapshots
  const fetchSnapshots = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        filter,
        limit: limit.toString(),
      });

      const response = await fetch(`/api/snapshots?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch snapshots');
      }

      const data = await response.json();
      if (data.success) {
        // Convert timestamp strings to Date objects
        const snapshotsWithDates = data.data.snapshots.map((s: Snapshot & { timestamp: string }) => ({
          ...s,
          timestamp: new Date(s.timestamp),
        }));
        setSnapshots(snapshotsWithDates);
        setStats(data.data.stats);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setIsLoading(false);
    }
  }, [filter, limit]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchSnapshots();
    }
  }, [fetchSnapshots, autoFetch]);

  // Create snapshot
  const createSnapshot = useCallback(async (data: CreateSnapshotData): Promise<Snapshot | null> => {
    try {
      const response = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create snapshot');
      }

      const result = await response.json();
      if (result.success) {
        const newSnapshot = {
          ...result.data,
          timestamp: new Date(result.data.timestamp),
        };
        // Add to beginning of list
        setSnapshots((prev) => [newSnapshot, ...prev]);
        // Update stats
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          level1: data.level === 1 ? prev.level1 + 1 : prev.level1,
          level2: data.level === 2 ? prev.level2 + 1 : prev.level2,
        }));
        return newSnapshot;
      }
      throw new Error(result.error || 'Unknown error');
    } catch (err) {
      console.error('Failed to create snapshot:', err);
      return null;
    }
  }, []);

  // Toggle like
  const toggleLike = useCallback(async (id: string): Promise<boolean> => {
    const snapshot = snapshots.find((s) => s.id === id);
    if (!snapshot) return false;

    const newLiked = !snapshot.liked;

    // Optimistic update
    setSnapshots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, liked: newLiked } : s))
    );
    setStats((prev) => ({
      ...prev,
      liked: newLiked ? prev.liked + 1 : prev.liked - 1,
    }));

    try {
      const response = await fetch('/api/snapshots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, liked: newLiked }),
      });

      if (!response.ok) {
        throw new Error('Failed to update snapshot');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return true;
    } catch (err) {
      // Revert on failure
      console.error('Failed to toggle like:', err);
      setSnapshots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, liked: snapshot.liked } : s))
      );
      setStats((prev) => ({
        ...prev,
        liked: snapshot.liked ? prev.liked + 1 : prev.liked - 1,
      }));
      return false;
    }
  }, [snapshots]);

  // Update snapshot
  const updateSnapshot = useCallback(
    async (id: string, data: { description?: string; tags?: string[] }): Promise<boolean> => {
      try {
        const response = await fetch('/api/snapshots', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
          throw new Error('Failed to update snapshot');
        }

        const result = await response.json();
        if (result.success) {
          setSnapshots((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ...data } : s))
          );
          return true;
        }
        throw new Error(result.error);
      } catch (err) {
        console.error('Failed to update snapshot:', err);
        return false;
      }
    },
    []
  );

  // Delete snapshot
  const deleteSnapshot = useCallback(async (id: string): Promise<boolean> => {
    const snapshot = snapshots.find((s) => s.id === id);
    if (!snapshot) return false;

    // Optimistic update
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    setStats((prev) => ({
      ...prev,
      total: prev.total - 1,
      liked: snapshot.liked ? prev.liked - 1 : prev.liked,
      level1: snapshot.level === 1 ? prev.level1 - 1 : prev.level1,
      level2: snapshot.level === 2 ? prev.level2 - 1 : prev.level2,
    }));

    try {
      const response = await fetch(`/api/snapshots?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete snapshot');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return true;
    } catch (err) {
      // Revert on failure
      console.error('Failed to delete snapshot:', err);
      setSnapshots((prev) => [...prev, snapshot].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ));
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        liked: snapshot.liked ? prev.liked + 1 : prev.liked,
        level1: snapshot.level === 1 ? prev.level1 + 1 : prev.level1,
        level2: snapshot.level === 2 ? prev.level2 + 1 : prev.level2,
      }));
      return false;
    }
  }, [snapshots]);

  return {
    snapshots,
    stats,
    isLoading,
    error,
    refresh: fetchSnapshots,
    createSnapshot,
    toggleLike,
    updateSnapshot,
    deleteSnapshot,
  };
}
