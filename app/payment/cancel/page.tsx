'use client';

import Link from 'next/link';
import { TrainIcon, XCircleIcon, RefreshIcon, ArrowLeftIcon } from '@/components/icons';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050508] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

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

      {/* Cancel Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#12121c] rounded-2xl border border-white/10 p-8 text-center">
          {/* Cancel Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-500/20 to-gray-600/20 mb-6">
            <XCircleIcon size={48} className="text-gray-400" />
          </div>

          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Payment Cancelled
          </h1>

          <p className="text-gray-400 mb-6">
            Your payment was cancelled. No charges were made to your account.
          </p>

          {/* Info Box */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-white mb-2">What happened?</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>You cancelled the payment process</li>
              <li>Your card was not charged</li>
              <li>You can try again anytime</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/?showTokenStore=true"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <RefreshIcon size={20} />
              Try Again
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 transition-all"
            >
              <ArrowLeftIcon size={20} />
              Back to Arcade
            </Link>
          </div>

          {/* Support Link */}
          <p className="mt-6 text-xs text-gray-500">
            Having trouble? <a href="mailto:support@railroad-arcade.com" className="text-cyan-400 hover:text-cyan-300">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
