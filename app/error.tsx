'use client';

// ============================================
// Global Error Handler
// ============================================
// Handles errors at the root level using Next.js
// App Router error handling patterns.

import { useEffect } from 'react';
import { TrainIcon } from '@/components/icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/30">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title */}
        <h1
          className="text-2xl font-bold text-white mb-3"
          style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
        >
          Something went wrong!
        </h1>

        {/* Error Message */}
        <p className="text-gray-400 mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 text-sm font-semibold text-gray-900 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all min-h-[44px]"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 text-sm font-semibold text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all min-h-[44px] flex items-center justify-center"
          >
            <TrainIcon size={16} className="mr-2" />
            Return Home
          </a>
        </div>

        {/* Error Details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
              Error Details
            </summary>
            <pre className="mt-3 p-4 text-xs text-red-300 bg-red-500/10 rounded-xl overflow-auto max-h-40 border border-red-500/20">
              {error.stack || error.message}
            </pre>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-600">
                Error ID: {error.digest}
              </p>
            )}
          </details>
        )}
      </div>
    </div>
  );
}
