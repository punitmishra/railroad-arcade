'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import { TrophyIcon, ArrowLeftIcon, SparklesIcon, LockIcon } from '@/components/icons';

export default function AchievementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { earned, available, stats, isLoading, error } = useAchievements();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return <LoadingState />;
  }

  if (!session?.user) {
    return null;
  }

  // Combine earned and available for display
  const allAchievements = [
    ...earned.map(a => ({ ...a, earned: true })),
    ...available.filter(a => !earned.some(e => e.id === a.id)).map(a => ({ ...a, earned: false })),
  ];

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
            <div className="flex-1">
              <h1
                className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Achievements
              </h1>
              <p className="text-xs text-gray-500">Track your progress</p>
            </div>
            {stats && (
              <div className="text-right">
                <div className="text-xl font-bold text-amber-400">{stats.points}</div>
                <div className="text-xs text-gray-500">/ {stats.maxPoints} pts</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Summary */}
        {stats && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <TrophyIcon size={32} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Achievement Progress</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-amber-400 font-medium">
                    {stats.earned} / {stats.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6 text-red-400 text-sm">
            Failed to load achievements. Please try again.
          </div>
        )}

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              icon={achievement.icon}
              name={achievement.name}
              description={achievement.description}
              points={achievement.points}
              earned={achievement.earned}
            />
          ))}
        </div>

        {allAchievements.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <TrophyIcon size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No Achievements Yet</h3>
            <p className="text-sm text-gray-500">Start playing to earn achievements!</p>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-pulse">
          <TrophyIcon size={32} className="text-white" />
        </div>
        <p className="text-gray-400">Loading achievements...</p>
      </div>
    </div>
  );
}

function AchievementCard({
  icon,
  name,
  description,
  points,
  earned,
}: {
  icon: string;
  name: string;
  description: string;
  points: number;
  earned: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        earned
          ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30'
          : 'bg-white/[0.02] border-white/10 opacity-60'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
            earned ? 'bg-amber-500/20' : 'bg-white/5'
          }`}
        >
          {earned ? icon : <LockIcon size={24} className="text-gray-500" />}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h3 className={`font-semibold ${earned ? 'text-white' : 'text-gray-400'}`}>
              {name}
            </h3>
            <div
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                earned
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-white/5 text-gray-500'
              }`}
            >
              {points} pts
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>

      {/* Earned Badge */}
      {earned && (
        <div className="absolute top-2 right-2">
          <SparklesIcon size={16} className="text-amber-400" />
        </div>
      )}
    </div>
  );
}
