'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { UserIcon, LogoutIcon, SettingsIcon, HistoryIcon, TrophyIcon, ChartIcon } from '../icons';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [achievementCount, setAchievementCount] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch achievement count
  useEffect(() => {
    if (session?.user) {
      fetch('/api/achievements')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAchievementCount(data.data.stats?.earned ?? 0);
          }
        })
        .catch(() => {
          // Silently fail - not critical
        });
    }
  }, [session]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return (
      <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/login"
          className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all"
        >
          Sign In
        </a>
        <a
          href="/signup"
          className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all"
        >
          Sign Up
        </a>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {session.user.name?.charAt(0) || session.user.email?.charAt(0) || '?'}
            </span>
          </div>
        )}
        <span className="text-sm font-medium text-gray-300 hidden sm:block">
          {session.user.name || session.user.email?.split('@')[0]}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1a1a24] border border-white/10 shadow-xl overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate">
              {session.user.name || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {session.user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <a
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-all"
            >
              <UserIcon size={16} />
              Profile
            </a>
            <a
              href="/achievements"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-all"
            >
              <TrophyIcon size={16} />
              <span className="flex-1">Achievements</span>
              {achievementCount !== null && achievementCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400">
                  {achievementCount}
                </span>
              )}
            </a>
            <a
              href="/leaderboards"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-all"
            >
              <ChartIcon size={16} />
              Leaderboards
            </a>
            <a
              href="/history"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-all"
            >
              <HistoryIcon size={16} />
              Session History
            </a>
            <a
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-all"
            >
              <SettingsIcon size={16} />
              Settings
            </a>
          </div>

          {/* Sign Out */}
          <div className="p-2 border-t border-white/10">
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogoutIcon size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Dialog */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12121c] rounded-xl border border-white/10 p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <LogoutIcon size={24} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Sign Out?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors min-h-[44px]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
