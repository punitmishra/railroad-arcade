'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { UserIcon, LogoutIcon, SettingsIcon, HistoryIcon, TrophyIcon } from '../icons';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
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
              Achievements
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
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogoutIcon size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
