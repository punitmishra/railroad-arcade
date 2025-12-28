'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useGameMode } from '@/lib/contexts/ModeContext';
import { QUEUE_TIME_PACKAGES, EXTEND_TIME_PACKAGES } from '@/lib/pricing';
import { ArcadeButton } from '@/components/ui';

// ============================================
// Types
// ============================================

interface QueueState {
  totalInQueue: number;
  currentController: {
    position: number;
    controlEndsAt: string | null;
  } | null;
  waitingCount: number;
  averageWaitTime: number;
}

interface HardwareStatus {
  online: boolean;
  latency?: number;
  lastChecked: number;
}

interface UserPosition {
  id: string;
  position: number;
  estimatedWaitTime: number;
  controlEndsAt: string | null;
  status: string;
}

// ============================================
// LiveQueuePanel Component
// ============================================

export function LiveQueuePanel() {
  const { data: session } = useSession();
  const { mode, setQueuePosition } = useGameMode();

  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(QUEUE_TIME_PACKAGES[1].id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Fetch queue state
  const fetchQueueState = useCallback(async () => {
    try {
      const response = await fetch('/api/queue');
      const data = await response.json();

      if (data.success) {
        setQueueState(data.data.queue);
        setUserPosition(data.data.userPosition);
        setHardwareStatus(data.data.hardware);

        // Update context
        if (data.data.userPosition) {
          setQueuePosition({
            position: data.data.userPosition.position,
            totalInQueue: data.data.queue.totalInQueue,
            estimatedWaitTime: data.data.userPosition.estimatedWaitTime,
            controlEndsAt: data.data.userPosition.controlEndsAt
              ? new Date(data.data.userPosition.controlEndsAt)
              : null,
            isActive: data.data.userPosition.status === 'ACTIVE',
          });
        } else {
          setQueuePosition(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch queue state:', err);
    }
  }, [setQueuePosition]);

  // Poll queue state
  useEffect(() => {
    if (mode !== 'live') return;

    fetchQueueState();
    const interval = setInterval(fetchQueueState, 5000);
    return () => clearInterval(interval);
  }, [mode, fetchQueueState]);

  // Countdown timer for active session
  useEffect(() => {
    if (userPosition?.status !== 'ACTIVE' || !userPosition.controlEndsAt) {
      setRemainingTime(0);
      return;
    }

    const updateTimer = () => {
      const endTime = new Date(userPosition.controlEndsAt!).getTime();
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setRemainingTime(remaining);

      if (remaining === 0) {
        fetchQueueState();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [userPosition, fetchQueueState]);

  // Join queue
  const handleJoinQueue = async () => {
    if (!session) return;

    // Check hardware status first
    if (!hardwareStatus?.online) {
      setError('Hardware is offline - cannot join queue at this time');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timePackageId: selectedPackage }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchQueueState();
      } else {
        // Handle hardware offline error specially
        if (data.hardwareOffline) {
          setError('Hardware is currently offline. Please try again later.');
          // Force refresh hardware status
          await fetchQueueState();
        } else {
          setError(data.error || 'Failed to join queue');
        }
      }
    } catch (err) {
      setError('Failed to join queue');
    } finally {
      setIsLoading(false);
    }
  };

  // Leave queue
  const handleLeaveQueue = async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/queue', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchQueueState();
      } else {
        setError(data.error || 'Failed to leave queue');
      }
    } catch (err) {
      setError('Failed to leave queue');
    } finally {
      setIsLoading(false);
    }
  };

  // Extend session
  const handleExtendSession = async (packageId: string) => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/queue/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extendPackageId: packageId }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchQueueState();
      } else {
        setError(data.error || 'Failed to extend session');
      }
    } catch (err) {
      setError('Failed to extend session');
    } finally {
      setIsLoading(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't show in demo mode
  if (mode !== 'live') {
    return null;
  }

  const isInQueue = userPosition !== null;
  const isActive = userPosition?.status === 'ACTIVE';

  return (
    <div className="bg-[#12121c] rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${hardwareStatus?.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <h3 className="font-semibold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Live Control Queue
            </h3>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {/* Hardware status badge */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${hardwareStatus?.online ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hardwareStatus?.online ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="text-xs">{hardwareStatus?.online ? 'Online' : 'Offline'}</span>
              {hardwareStatus?.online && hardwareStatus.latency && (
                <span className="text-xs text-gray-500">{hardwareStatus.latency}ms</span>
              )}
            </div>
            <div className="text-gray-400">
              {queueState?.totalInQueue ?? 0} in queue
            </div>
          </div>
        </div>
      </div>

      {/* Hardware offline banner */}
      {hardwareStatus && !hardwareStatus.online && (
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/30">
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">Hardware Offline</p>
              <p className="text-sm text-red-400/70">The railroad control system is currently unavailable. Please try again later.</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Error message */}
        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Not logged in */}
        {!session && (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-4">Sign in to join the queue and control the live trains!</p>
            <ArcadeButton variant="primary" onClick={() => window.location.href = '/login'}>
              Sign In
            </ArcadeButton>
          </div>
        )}

        {/* Logged in but not in queue */}
        {session && !isInQueue && (
          <div className="space-y-4">
            {/* Time package selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Session Duration</label>
              <div className="grid grid-cols-2 gap-2">
                {QUEUE_TIME_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`
                      p-3 rounded-lg border text-left transition-all
                      ${selectedPackage === pkg.id
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{pkg.name}</span>
                      {pkg.popular && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{Math.floor(pkg.duration / 60)} min</span>
                      <span className="text-amber-400 font-mono">{pkg.tokens} tokens</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Queue status */}
            {queueState && queueState.waitingCount > 0 && (
              <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                <span className="text-amber-400">{queueState.waitingCount} users waiting</span>
                <span className="text-gray-400"> - est. wait: </span>
                <span className="text-amber-400">{formatTime(queueState.averageWaitTime * queueState.waitingCount)}</span>
              </div>
            )}

            {/* Join button */}
            <ArcadeButton
              variant="primary"
              className="w-full"
              onClick={handleJoinQueue}
              disabled={isLoading || !hardwareStatus?.online}
            >
              {isLoading ? 'Joining...' : !hardwareStatus?.online ? 'Hardware Offline' : 'Join Queue'}
            </ArcadeButton>
          </div>
        )}

        {/* In queue, waiting */}
        {session && isInQueue && !isActive && (
          <div className="space-y-4">
            {/* Position display */}
            <div className="text-center py-4">
              <div className="text-6xl font-bold text-cyan-400 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                #{userPosition!.position}
              </div>
              <p className="text-gray-400">Your position in queue</p>
            </div>

            {/* Estimated wait */}
            <div className="flex items-center justify-center gap-2 text-lg">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-400">Est. wait:</span>
              <span className="text-white font-mono">{formatTime(userPosition!.estimatedWaitTime)}</span>
            </div>

            {/* Leave queue button */}
            <ArcadeButton
              variant="ghost"
              className="w-full"
              onClick={handleLeaveQueue}
              disabled={isLoading}
            >
              {isLoading ? 'Leaving...' : 'Leave Queue (Get Refund)'}
            </ArcadeButton>
          </div>
        )}

        {/* Active control */}
        {session && isActive && (
          <div className="space-y-4">
            {/* Control badge */}
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold">You Have Control!</span>
              </div>
            </div>

            {/* Time remaining */}
            <div className="text-center">
              <div className={`text-5xl font-bold font-mono ${remainingTime <= 30 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                {formatTime(remainingTime)}
              </div>
              <p className="text-gray-400 mt-1">Time remaining</p>
            </div>

            {/* Extend options */}
            {remainingTime < 120 && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-3">Running low on time? Extend your session:</p>
                <div className="flex gap-2">
                  {EXTEND_TIME_PACKAGES.map((pkg) => (
                    <ArcadeButton
                      key={pkg.id}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleExtendSession(pkg.id)}
                      disabled={isLoading}
                    >
                      {pkg.name} ({pkg.tokens} tokens)
                    </ArcadeButton>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Compact Queue Status (for header)
// ============================================

export function QueueStatusBadge() {
  const { queuePosition } = useGameMode();

  if (!queuePosition) return null;

  if (queuePosition.isActive) {
    const remainingSeconds = queuePosition.controlEndsAt
      ? Math.max(0, Math.floor((queuePosition.controlEndsAt.getTime() - Date.now()) / 1000))
      : 0;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 text-sm font-medium">
          Control: {mins}:{secs.toString().padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
      <span className="text-cyan-400 text-sm">Queue #{queuePosition.position}</span>
    </div>
  );
}
