'use client';

// ============================================
// Hardware Session Hook
// ============================================
// Manages active hardware control sessions on
// the client side. Handles heartbeat, session
// start/end, and timeout notifications.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { clearSessionValidationCache } from './useHardwareAdapter';

// ============================================
// Types
// ============================================

export interface HardwareSessionInfo {
  sessionId: string;
  remainingSeconds: number;
  startedAt: string;
  endsAt: string;
  hardwareNotified: boolean;
}

export interface UseHardwareSessionOptions {
  /** Enable automatic heartbeat (default: true) */
  autoHeartbeat?: boolean;
  /** Heartbeat interval in ms (default: 15000) */
  heartbeatInterval?: number;
  /** Callback when session ends */
  onSessionEnd?: (reason: 'expired' | 'timeout' | 'manual' | 'error') => void;
  /** Callback when session is about to expire (< 60s remaining) */
  onSessionExpiring?: (remainingSeconds: number) => void;
  /** Callback for session errors */
  onError?: (error: string) => void;
}

export interface UseHardwareSessionReturn {
  /** Current session info (null if no active session) */
  session: HardwareSessionInfo | null;
  /** Whether user has an active session */
  hasSession: boolean;
  /** Whether session is loading */
  isLoading: boolean;
  /** Last error message */
  error: string | null;
  /** Whether session is about to expire (< 60s) */
  isExpiringSoon: boolean;
  /** Start the session (notify hardware) */
  startSession: () => Promise<boolean>;
  /** End the session manually */
  endSession: () => Promise<boolean>;
  /** Send a manual heartbeat */
  sendHeartbeat: () => Promise<boolean>;
  /** Refresh session state from server */
  refreshSession: () => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useHardwareSession(
  options: UseHardwareSessionOptions = {}
): UseHardwareSessionReturn {
  const {
    autoHeartbeat = true,
    heartbeatInterval = 15000,
    onSessionEnd,
    onSessionExpiring,
    onError,
  } = options;

  const { data: authSession } = useSession();

  const [session, setSession] = useState<HardwareSessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRemainingSecondsRef = useRef<number>(0);

  // Track if we've notified about expiring
  const hasNotifiedExpiringRef = useRef(false);

  // ============================================
  // Session Fetching
  // ============================================

  const refreshSession = useCallback(async () => {
    if (!authSession?.user) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/session');
      const data = await response.json();

      if (data.success && data.data.hasSession) {
        setSession(data.data.session);
        lastRemainingSecondsRef.current = data.data.session.remainingSeconds;
        setError(null);
      } else {
        // Session ended or doesn't exist
        if (session !== null) {
          onSessionEnd?.('expired');
          clearSessionValidationCache();
        }
        setSession(null);
      }
    } catch (err) {
      setError('Failed to fetch session');
      onError?.('Failed to fetch session');
    } finally {
      setIsLoading(false);
    }
  }, [authSession?.user, session, onSessionEnd, onError]);

  // ============================================
  // Session Start
  // ============================================

  const startSession = useCallback(async (): Promise<boolean> => {
    if (!authSession?.user) {
      setError('Not authenticated');
      return false;
    }

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      const data = await response.json();

      if (data.success) {
        await refreshSession();
        clearSessionValidationCache();
        return true;
      } else {
        setError(data.error || 'Failed to start session');
        onError?.(data.error || 'Failed to start session');
        return false;
      }
    } catch (err) {
      setError('Failed to start session');
      onError?.('Failed to start session');
      return false;
    }
  }, [authSession?.user, refreshSession, onError]);

  // ============================================
  // Session End
  // ============================================

  const endSession = useCallback(async (): Promise<boolean> => {
    if (!authSession?.user || !session) {
      return false;
    }

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      });

      const data = await response.json();

      if (data.success) {
        setSession(null);
        clearSessionValidationCache();
        onSessionEnd?.('manual');
        return true;
      } else {
        setError(data.error || 'Failed to end session');
        return false;
      }
    } catch (err) {
      setError('Failed to end session');
      return false;
    }
  }, [authSession?.user, session, onSessionEnd]);

  // ============================================
  // Heartbeat
  // ============================================

  const sendHeartbeat = useCallback(async (): Promise<boolean> => {
    if (!authSession?.user || !session) {
      return false;
    }

    try {
      const response = await fetch('/api/session/heartbeat', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        // Update remaining seconds from server
        setSession((prev) =>
          prev
            ? {
                ...prev,
                remainingSeconds: data.data.remainingSeconds,
              }
            : null
        );
        lastRemainingSecondsRef.current = data.data.remainingSeconds;
        setError(null);

        // Check if expiring soon
        if (data.data.isExpiringSoon && !hasNotifiedExpiringRef.current) {
          hasNotifiedExpiringRef.current = true;
          onSessionExpiring?.(data.data.remainingSeconds);
        }

        return true;
      } else {
        // Session may have ended
        if (data.hasSession === false) {
          setSession(null);
          clearSessionValidationCache();
          onSessionEnd?.('expired');
        }
        return false;
      }
    } catch (err) {
      setError('Heartbeat failed');
      return false;
    }
  }, [authSession?.user, session, onSessionEnd, onSessionExpiring]);

  // ============================================
  // Auto Heartbeat
  // ============================================

  useEffect(() => {
    if (!autoHeartbeat || !session) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Start heartbeat interval
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, heartbeatInterval);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [autoHeartbeat, session, heartbeatInterval, sendHeartbeat]);

  // ============================================
  // Local Countdown
  // ============================================

  useEffect(() => {
    if (!session) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    // Update remaining seconds locally every second
    countdownIntervalRef.current = setInterval(() => {
      setSession((prev) => {
        if (!prev) return null;

        const newRemaining = Math.max(0, prev.remainingSeconds - 1);

        // Check for expiring soon
        if (newRemaining <= 60 && !hasNotifiedExpiringRef.current) {
          hasNotifiedExpiringRef.current = true;
          onSessionExpiring?.(newRemaining);
        }

        // Check for session end
        if (newRemaining === 0) {
          clearSessionValidationCache();
          onSessionEnd?.('expired');
          return null;
        }

        return { ...prev, remainingSeconds: newRemaining };
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [session?.sessionId, onSessionEnd, onSessionExpiring]);

  // ============================================
  // Initial Load
  // ============================================

  useEffect(() => {
    if (authSession?.user) {
      refreshSession();
    } else {
      setSession(null);
      setIsLoading(false);
    }
  }, [authSession?.user]);

  // Reset expiring notification when session changes
  useEffect(() => {
    hasNotifiedExpiringRef.current = false;
  }, [session?.sessionId]);

  // ============================================
  // Return Value
  // ============================================

  const isExpiringSoon = session ? session.remainingSeconds <= 60 : false;

  return {
    session,
    hasSession: session !== null,
    isLoading,
    error,
    isExpiringSoon,
    startSession,
    endSession,
    sendHeartbeat,
    refreshSession,
  };
}

// ============================================
// Utility Hook: Session Timer Display
// ============================================

export function useSessionTimer(remainingSeconds: number): string {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
