'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ClockIcon, ArrowLeftIcon, TrainIcon, CoinsIcon,
  CalendarIcon, ChartIcon, PlayIcon
} from '@/components/icons';

interface SessionRecord {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  tokensSpent: number;
  status: string;
  totalDistance: number;
  trainsOperated: string[];
  modulesUsed: string[];
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchSessions();
    }
  }, [session]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'completed') return s.status === 'COMPLETED';
    if (filter === 'active') return s.status === 'ACTIVE';
    return true;
  });

  const totalStats = {
    sessions: sessions.length,
    tokensSpent: sessions.reduce((sum, s) => sum + s.tokensSpent, 0),
    totalTime: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
    totalDistance: sessions.reduce((sum, s) => sum + s.totalDistance, 0),
  };

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
                className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Session History
              </h1>
              <p className="text-xs text-gray-500">Review your past sessions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<PlayIcon size={18} />}
            label="Total Sessions"
            value={totalStats.sessions}
            color="cyan"
          />
          <StatCard
            icon={<CoinsIcon size={18} />}
            label="Tokens Spent"
            value={totalStats.tokensSpent}
            color="amber"
          />
          <StatCard
            icon={<ClockIcon size={18} />}
            label="Play Time"
            value={formatDuration(totalStats.totalTime)}
            color="purple"
          />
          <StatCard
            icon={<TrainIcon size={18} />}
            label="Distance"
            value={`${(totalStats.totalDistance / 1000).toFixed(1)}km`}
            color="emerald"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'completed', 'active'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-[#0c0c14] border border-white/10">
              <ClockIcon size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No Sessions Yet</h3>
              <p className="text-sm text-gray-500">Start playing to see your history here!</p>
            </div>
          ) : (
            filteredSessions.map(sessionRecord => (
              <SessionCard key={sessionRecord.id} session={sessionRecord} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center animate-pulse">
          <ClockIcon size={32} className="text-white" />
        </div>
        <p className="text-gray-400">Loading history...</p>
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
    <div className={`rounded-xl bg-gradient-to-br ${colors[color]} border p-4`}>
      <div className={`${colors[color].split(' ').pop()} mb-2`}>{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function SessionCard({ session }: { session: SessionRecord }) {
  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ACTIVE: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    INTERRUPTED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    EMERGENCY_STOPPED: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="rounded-xl bg-[#0c0c14] border border-white/10 p-4 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <TrainIcon size={20} className="text-cyan-400" />
          </div>
          <div>
            <div className="font-medium text-white">
              {new Date(session.startTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(session.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${statusColors[session.status] || 'bg-white/5 text-gray-400'}`}>
          {session.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-500 text-xs mb-1">Duration</div>
          <div className="text-white font-medium">
            {session.duration ? formatDuration(session.duration) : '--'}
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-xs mb-1">Tokens</div>
          <div className="text-amber-400 font-medium flex items-center gap-1">
            <CoinsIcon size={14} />
            {session.tokensSpent}
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-xs mb-1">Distance</div>
          <div className="text-white font-medium">
            {(session.totalDistance / 100).toFixed(1)}m
          </div>
        </div>
      </div>

      {session.trainsOperated.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="text-xs text-gray-500 mb-2">Trains Operated</div>
          <div className="flex flex-wrap gap-1">
            {session.trainsOperated.map(train => (
              <span key={train} className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-xs">
                {train}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}
