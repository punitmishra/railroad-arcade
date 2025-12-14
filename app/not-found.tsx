'use client';

import Link from 'next/link';
import { TrainIcon } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] p-4">
      <div className="text-center max-w-md">
        {/* Animated train icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
            <TrainIcon size={48} className="text-cyan-400" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent rounded-full" />
        </div>

        {/* Error code */}
        <h1
          className="text-6xl sm:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          404
        </h1>

        {/* Message */}
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
          Track Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          Looks like this train took a wrong turn. The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Station
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Decorative track */}
        <div className="mt-12 flex items-center justify-center gap-1 opacity-30">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-8 h-1 bg-gray-600 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
