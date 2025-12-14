'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { DEFAULT_UNLOCKED_MODULES } from '@/lib/pricing';

// ============================================
// Types
// ============================================

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  tokenBalance: number;
  totalTokensUsed: number;
  totalSessions: number;
  unlockedModules: string[];
  createdAt: string;
}

export interface UseUserReturn {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  tokens: number;
  unlockedModules: string[];
  refetch: () => Promise<void>;
  updateTokens: (newBalance: number) => void;
  addUnlockedModule: (moduleId: string) => void;
}

// ============================================
// Hook: useUser
// ============================================
// Fetches and manages user profile data including
// token balance and unlocked modules.

export function useUser(): UseUserReturn {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  // Fetch user profile from API
  const fetchUser = useCallback(async () => {
    if (!isAuthenticated) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user');

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return;
        }
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch on mount and when auth state changes
  useEffect(() => {
    if (status !== 'loading') {
      fetchUser();
    }
  }, [status, fetchUser]);

  // Refetch on window focus (for fresh data after payment redirect)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated) {
        fetchUser();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, fetchUser]);

  // Update token balance locally (optimistic update)
  const updateTokens = useCallback((newBalance: number) => {
    setUser((prev) => prev ? { ...prev, tokenBalance: newBalance } : null);
  }, []);

  // Add unlocked module locally (optimistic update)
  const addUnlockedModule = useCallback((moduleId: string) => {
    setUser((prev) => {
      if (!prev) return null;
      if (prev.unlockedModules.includes(moduleId)) return prev;
      return {
        ...prev,
        unlockedModules: [...prev.unlockedModules, moduleId],
      };
    });
  }, []);

  // Derive values for convenience
  const tokens = user?.tokenBalance ?? 0;
  const unlockedModules = user?.unlockedModules ?? DEFAULT_UNLOCKED_MODULES;

  return {
    user,
    isLoading: status === 'loading' || isLoading,
    isAuthenticated,
    error,
    tokens,
    unlockedModules,
    refetch: fetchUser,
    updateTokens,
    addUnlockedModule,
  };
}

// ============================================
// Hook: useUnlockModule
// ============================================
// Handles unlocking a module with token deduction

export function useUnlockModule() {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlockModule = useCallback(async (
    moduleId: string,
    cost: number,
    onSuccess?: (data: { unlockedModules: string[]; tokenBalance: number }) => void
  ) => {
    setIsUnlocking(true);
    setError(null);

    try {
      const response = await fetch('/api/user/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, cost }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlock module');
      }

      onSuccess?.(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsUnlocking(false);
    }
  }, []);

  return {
    unlockModule,
    isUnlocking,
    error,
  };
}

// ============================================
// Hook: useStartSession
// ============================================
// Handles starting a play session with token deduction

export function useStartSession() {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (
    duration: number,
    tokenCost: number,
    onSuccess?: (data: { sessionId: string; expiresAt: string; tokenBalance: number }) => void
  ) => {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration, tokenCost }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start session');
      }

      onSuccess?.(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsStarting(false);
    }
  }, []);

  return {
    startSession,
    isStarting,
    error,
  };
}
