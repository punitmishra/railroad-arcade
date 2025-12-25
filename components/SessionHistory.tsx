'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  HistoryIcon, CalendarIcon, TrainIcon, ClockIcon,
  TrophyIcon, ActivityIcon, ChartIcon, DownloadIcon,
  ChevronDownIcon, SparklesIcon
} from './icons';
import { SkeletonRow } from './ui';
import {
  useSessionHistory,
  Session,
  SessionEvent,
  DateRange,
  formatDuration,
  getEventIcon,
  getStatusColor,
} from '@/hooks/useSessionHistory';

export function SessionHistory() {
  const { data: authSession } = useSession();
  const [activeTab, setActiveTab] = useState<'sessions' | 'timeline' | 'stats'>('sessions');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('week');

  const { sessions, stats, isLoading, error, hasMore, loadMore, refresh } = useSessionHistory({
    dateRange,
    limit: 20,
  });

  const tabs = [
    { id: 'sessions' as const, label: 'Sessions', icon: <HistoryIcon size={18} /> },
    { id: 'timeline' as const, label: 'Timeline', icon: <ActivityIcon size={18} /> },
    { id: 'stats' as const, label: 'Statistics', icon: <ChartIcon size={18} /> },
  ];

  // Get all events from sessions for timeline view
  const allEvents = sessions
    .flatMap(s => s.events.map(e => ({ ...e, sessionId: s.id })))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 30);

  return (
    <div className="bg-[#0c0c14] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-500/[0.08] to-orange-500/[0.08] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
            <HistoryIcon size={22} className="text-amber-400" />
          </div>
          <div>
            <h3
              className="font-semibold text-[15px] tracking-wide"
              style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
            >
              Session History
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {stats.totalSessions} sessions {stats.totalDuration > 0 && `• ${formatDuration(stats.totalDuration)} total`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 outline-none min-h-[44px]"
            aria-label="Select date range"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={() => refresh()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all min-h-[44px]"
            aria-label="Refresh sessions"
          >
            <DownloadIcon size={16} />
            <span className="text-sm hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 py-3 bg-black/20 border-b border-white/[0.04] overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap min-h-[44px]
              ${activeTab === tab.id
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Not signed in */}
        {!authSession?.user && (
          <div className="text-center py-12">
            <HistoryIcon size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Sign in to view your session history</p>
            <p className="text-xs text-gray-600">Track your playtime, achievements, and stats</p>
          </div>
        )}

        {/* Loading */}
        {authSession?.user && isLoading && (
          <div className="space-y-3" aria-label="Loading sessions">
            {[1, 2, 3].map(i => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {authSession?.user && error && !isLoading && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-3">Failed to load sessions</p>
            <button
              onClick={() => refresh()}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {authSession?.user && !isLoading && !error && sessions.length === 0 && (
          <div className="text-center py-12">
            <TrainIcon size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No sessions found</p>
            <p className="text-xs text-gray-600">Start playing to record your sessions!</p>
          </div>
        )}

        {/* Sessions List */}
        {authSession?.user && !isLoading && !error && sessions.length > 0 && activeTab === 'sessions' && (
          <div className="space-y-3">
            {sessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                isExpanded={expandedSession === session.id}
                onToggle={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              />
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                Load More
              </button>
            )}
          </div>
        )}

        {/* Timeline View */}
        {authSession?.user && !isLoading && !error && activeTab === 'timeline' && (
          <div className="relative">
            {allEvents.length === 0 ? (
              <div className="text-center py-12">
                <ActivityIcon size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No events to display</p>
              </div>
            ) : (
              <>
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />
                <div className="space-y-6">
                  {allEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 pl-4">
                      <div
                        className="w-5 h-5 rounded-full bg-[#0c0c14] border-2 flex items-center justify-center z-10 text-xs"
                        style={{
                          borderColor: event.type === 'EMERGENCY' ? '#ef4444' :
                            event.type === 'ACHIEVEMENT' ? '#f59e0b' : '#22c55e'
                        }}
                      >
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="text-sm font-medium">{event.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {event.timestamp.toLocaleDateString()} at {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Statistics */}
        {authSession?.user && !isLoading && !error && activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Sessions', value: stats.totalSessions, icon: '🎮', color: '#00f0ff' },
                { label: 'Time Played', value: formatDuration(stats.totalDuration), icon: '⏱️', color: '#a855f7' },
                { label: 'Tokens Spent', value: stats.totalTokensSpent, icon: '🪙', color: '#f59e0b' },
                { label: 'Distance', value: `${stats.totalDistance.toFixed(1)} km`, icon: '📏', color: '#22c55e' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{stat.icon}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: stat.color, fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Sessions This Week */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <h4 className="font-semibold mb-4">This Week</h4>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-cyan-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {stats.sessionsThisWeek}
                </div>
                <div className="text-gray-500 text-sm">
                  sessions played
                </div>
              </div>
            </div>

            {/* Train Usage */}
            {sessions.length > 0 && (
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h4 className="font-semibold mb-4">Most Used Trains</h4>
                <div className="space-y-3">
                  {getTrainStats(sessions).map((train, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ['#22c55e', '#3b82f6', '#a855f7'][i % 3] }}
                      />
                      <span className="flex-1 font-medium text-sm">{train.name}</span>
                      <span className="text-xs text-gray-500">{train.count} uses</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Session Card Component
// ============================================

function SessionCard({
  session,
  isExpanded,
  onToggle,
}: {
  session: Session;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const statusColor = getStatusColor(session.status);

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
      {/* Session Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-all"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${statusColor}15` }}
          >
            <TrainIcon size={24} style={{ color: statusColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{session.startTime.toLocaleDateString()}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase"
                style={{
                  backgroundColor: `${statusColor}20`,
                  color: statusColor
                }}
              >
                {session.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <span>{session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span>{formatDuration(session.duration || 0)}</span>
              {session.trainsOperated.length > 0 && (
                <>
                  <span>•</span>
                  <span>{session.trainsOperated.length} train{session.trainsOperated.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm font-semibold text-amber-400">{session.tokensSpent} tokens</div>
            <div className="text-xs text-gray-500">{session.totalDistance.toFixed(1)} km</div>
          </div>
          <ChevronDownIcon
            size={20}
            className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Expanded Events */}
      {isExpanded && (
        <div className="border-t border-white/[0.06] bg-black/20 p-4">
          {session.events.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No events recorded for this session</p>
          ) : (
            <>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Event Log</div>
              <div className="space-y-2">
                {session.events.map(event => (
                  <div key={event.id} className="flex items-center gap-3 text-sm">
                    <span className="text-lg">{getEventIcon(event.type)}</span>
                    <span className="text-gray-400 w-16 flex-shrink-0">
                      {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-gray-300">{event.description}</span>
                    {event.level && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: event.level === 1 ? 'rgba(168,85,247,0.2)' : 'rgba(14,165,233,0.2)',
                          color: event.level === 1 ? '#a855f7' : '#0ea5e9'
                        }}
                      >
                        L{event.level}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Trains Operated */}
          {session.trainsOperated.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Trains Operated</div>
              <div className="flex flex-wrap gap-2">
                {session.trainsOperated.map(train => (
                  <span key={train} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                    🚂 {train}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function getTrainStats(sessions: Session[]): { name: string; count: number }[] {
  const trainCounts: Record<string, number> = {};

  sessions.forEach(session => {
    session.trainsOperated.forEach(train => {
      trainCounts[train] = (trainCounts[train] || 0) + 1;
    });
  });

  return Object.entries(trainCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
