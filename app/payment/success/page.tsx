'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TrainIcon, SparklesIcon, CoinsIcon, CheckCircleIcon } from '@/components/icons';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [tokens, setTokens] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Get tokens from URL params (set by webhook or redirect)
    const tokensParam = searchParams.get('tokens');
    if (tokensParam) {
      setTokens(parseInt(tokensParam, 10));
    }

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050508] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Confetti animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#00f0ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <TrainIcon size={28} className="text-white" />
        </div>
        <span
          className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          RAILROAD ARCADE
        </span>
      </Link>

      {/* Success Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#12121c] rounded-2xl border border-emerald-500/30 p-8 text-center shadow-xl shadow-emerald-500/10">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 mb-6">
            <CheckCircleIcon size={48} className="text-emerald-400" />
          </div>

          <h1
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Payment Successful!
          </h1>

          <p className="text-gray-400 mb-6">
            Your tokens have been added to your account
          </p>

          {/* Token Display */}
          {tokens && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <CoinsIcon size={32} className="text-amber-400" />
                <span
                  className="text-4xl font-bold text-amber-400"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  +{tokens}
                </span>
              </div>
              <p className="text-amber-400/80 text-sm">Tokens added to your balance</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <SparklesIcon size={20} />
              Start Playing
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 transition-all"
            >
              Back to Arcade
            </Link>
          </div>

          {/* Receipt Info */}
          <p className="mt-6 text-xs text-gray-500">
            A receipt has been sent to your email address.
          </p>
        </div>
      </div>

      {/* CSS for confetti animation */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050508]">
      <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      <p className="mt-4 text-gray-400">Loading...</p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
