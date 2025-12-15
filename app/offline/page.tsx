'use client';

import { useEffect, useState } from 'react';
import { TrainIcon, WifiIcon } from '@/components/icons';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check if we're back online
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirect when back online
  useEffect(() => {
    if (isOnline) {
      window.location.href = '/';
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] p-6">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <TrainIcon size={48} className="text-white" />
          </div>
          {/* Offline indicator */}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#0a0a0f] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <WifiIcon size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-2xl sm:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          You&apos;re Offline
        </h1>

        {/* Message */}
        <p className="text-gray-400 mb-8 leading-relaxed">
          Railroad Arcade needs an internet connection to control the real model railroad.
          Please check your connection and try again.
        </p>

        {/* Status */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 mb-8">
          <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
          <span className="text-sm text-gray-400">Waiting for connection...</span>
        </div>

        {/* Retry button */}
        <div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>

        {/* Tip */}
        <p className="mt-8 text-xs text-gray-600">
          Tip: Install Railroad Arcade as an app for the best experience
        </p>
      </div>
    </div>
  );
}
