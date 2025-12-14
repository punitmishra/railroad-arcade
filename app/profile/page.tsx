'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import {
  UserIcon, CoinsIcon, TrophyIcon, ClockIcon, TrainIcon,
  CalendarIcon, ChartIcon, SettingsIcon, ArrowLeftIcon
} from '@/components/icons';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { user, tokens, unlockedModules, isLoading } = useUser();
  const [stats, setStats] = useState<{
    totalSessions: number;
    totalTokensUsed: number;
    totalDistance: number;
    favoriteModule: string;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (user) {
      // Fetch additional stats
      fetch('/api/user/stats')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStats(data.data);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  if (status === 'loading' || isLoading) {
    return <LoadingState />;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
            >
              <ArrowLeftIcon size={20} />
            </button>
            <div>
              <h1
                className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Profile
              </h1>
              <p className="text-xs text-gray-500">Manage your account</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={96}
                  height={96}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold text-white">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 border-4 border-[#0a0a0f] flex items-center justify-center">
                <span className="text-xs sm:text-sm">✓</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">
                {session.user.name || 'User'}
              </h2>
              <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base truncate">{session.user.email}</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <span className="px-2 sm:px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs sm:text-sm border border-cyan-500/30">
                  Member
                </span>
                {unlockedModules.length >= 5 && (
                  <span className="px-2 sm:px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs sm:text-sm border border-purple-500/30">
                    Collector
                  </span>
                )}
              </div>
            </div>

            {/* Token Balance */}
            <div className="text-center sm:text-right flex-shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <div className="text-2xl sm:text-3xl font-bold text-amber-400 flex items-center gap-2 justify-center sm:justify-end">
                <CoinsIcon size={24} className="sm:w-7 sm:h-7" />
                {tokens.toLocaleString()}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">tokens available</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <StatCard
            icon={<ClockIcon size={20} />}
            label="Sessions"
            value={stats?.totalSessions || user?.totalSessions || 0}
            color="cyan"
          />
          <StatCard
            icon={<CoinsIcon size={20} />}
            label="Tokens Used"
            value={stats?.totalTokensUsed || user?.totalTokensUsed || 0}
            color="amber"
          />
          <StatCard
            icon={<TrainIcon size={20} />}
            label="Distance"
            value={`${((stats?.totalDistance || 0) / 1000).toFixed(1)}km`}
            color="emerald"
          />
          <StatCard
            icon={<TrophyIcon size={20} />}
            label="Modules"
            value={unlockedModules.length}
            color="purple"
          />
        </div>

        {/* Unlocked Modules */}
        <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <ChartIcon size={18} className="text-cyan-400 sm:w-5 sm:h-5" />
            Unlocked Modules
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {[
              { id: 'trains', name: 'Train Tracking', icon: '🚂' },
              { id: 'scenery', name: 'Scenery', icon: '🌲' },
              { id: 'police', name: 'Police Station', icon: '🚔' },
              { id: 'fire', name: 'Fire Station', icon: '🚒' },
              { id: 'cafe', name: 'Café', icon: '☕' },
              { id: 'home', name: 'Smart Home', icon: '🏠' },
              { id: 'construction', name: 'Construction', icon: '🚧' },
              { id: 'crossing', name: 'Diamond Crossing', icon: '✖️' },
            ].map(module => {
              const isUnlocked = unlockedModules.includes(module.id);
              return (
                <div
                  key={module.id}
                  className={`p-2 sm:p-3 rounded-xl border text-center transition-all ${
                    isUnlocked
                      ? 'bg-white/5 border-white/20'
                      : 'bg-white/[0.02] border-white/5 opacity-40'
                  }`}
                >
                  <div className="text-xl sm:text-2xl mb-1">{module.icon}</div>
                  <div className="text-[10px] sm:text-xs text-gray-400 line-clamp-1">{module.name}</div>
                  {isUnlocked && (
                    <div className="text-[9px] sm:text-[10px] text-emerald-400 mt-1">Unlocked</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <QuickLink
            href="/achievements"
            icon={<TrophyIcon size={24} />}
            title="Achievements"
            description="View your earned achievements"
            color="amber"
          />
          <QuickLink
            href="/history"
            icon={<ClockIcon size={24} />}
            title="Session History"
            description="Review past sessions"
            color="cyan"
          />
          <QuickLink
            href="/settings"
            icon={<SettingsIcon size={24} />}
            title="Settings"
            description="Manage preferences"
            color="purple"
          />
        </div>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
          <UserIcon size={32} className="text-white" />
        </div>
        <p className="text-gray-400">Loading profile...</p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'cyan' | 'amber' | 'emerald' | 'purple';
}) {
  const colors = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`rounded-xl bg-gradient-to-br ${colors[color]} border p-3 sm:p-4`}>
      <div className={`${colors[color].split(' ').pop()} mb-1 sm:mb-2`}>{icon}</div>
      <div className="text-lg sm:text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] sm:text-xs text-gray-500">{label}</div>
    </div>
  );
}

function QuickLink({ href, icon, title, description, color }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'cyan' | 'amber' | 'purple';
}) {
  const colors = {
    cyan: 'hover:border-cyan-500/30 group-hover:text-cyan-400',
    amber: 'hover:border-amber-500/30 group-hover:text-amber-400',
    purple: 'hover:border-purple-500/30 group-hover:text-purple-400',
  };

  return (
    <a
      href={href}
      className={`group block p-3 sm:p-4 rounded-xl bg-[#0c0c14] border border-white/10 ${colors[color]} transition-all min-h-[44px]`}
    >
      <div className="text-gray-400 group-hover:text-white transition-colors mb-1 sm:mb-2">
        {icon}
      </div>
      <h4 className="font-medium text-white mb-0.5 sm:mb-1 text-sm sm:text-base">{title}</h4>
      <p className="text-[10px] sm:text-xs text-gray-500">{description}</p>
    </a>
  );
}
