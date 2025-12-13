'use client';

import { useState } from 'react';
import {
  HistoryIcon, CalendarIcon, TrainIcon, ClockIcon, ZapIcon,
  TrophyIcon, ActivityIcon, ChartIcon, FilterIcon, DownloadIcon,
  PlayIcon, ChevronDownIcon, MapIcon, SparklesIcon, CoinsIcon
} from './icons';

interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  tokensSpent: number;
  trainsOperated: string[];
  totalDistance: number; // km
  events: SessionEvent[];
  achievements: string[];
  status: 'completed' | 'interrupted' | 'emergency_stopped';
}

interface SessionEvent {
  id: string;
  timestamp: Date;
  type: 'train_start' | 'train_stop' | 'junction_switch' | 'crossing_activated' | 'snapshot' | 'achievement' | 'emergency';
  description: string;
  trainId?: string;
  level?: 1 | 2;
}

interface DailyStats {
  date: Date;
  sessions: number;
  totalDuration: number;
  tokensSpent: number;
  distance: number;
}

export function SessionHistory() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'timeline' | 'stats' | 'achievements'>('sessions');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const sessions: Session[] = [
    {
      id: 'session-1',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 1800000),
      duration: 1800,
      tokensSpent: 25,
      trainsOperated: ['Valley Runner', 'City Limited'],
      totalDistance: 12.5,
      achievements: ['First Junction Switch', 'Speed Demon'],
      status: 'completed',
      events: [
        { id: 'e1', timestamp: new Date(Date.now() - 3600000), type: 'train_start', description: 'Started Valley Runner', trainId: 'T1', level: 2 },
        { id: 'e2', timestamp: new Date(Date.now() - 3400000), type: 'junction_switch', description: 'Switched East Junction to diverge', level: 2 },
        { id: 'e3', timestamp: new Date(Date.now() - 3000000), type: 'snapshot', description: 'Captured snapshot at Grand Central', level: 2 },
        { id: 'e4', timestamp: new Date(Date.now() - 2400000), type: 'achievement', description: 'Earned "Speed Demon" achievement' },
        { id: 'e5', timestamp: new Date(Date.now() - 1800000), type: 'train_stop', description: 'Stopped Valley Runner', trainId: 'T1', level: 2 },
      ]
    },
    {
      id: 'session-2',
      startTime: new Date(Date.now() - 86400000),
      endTime: new Date(Date.now() - 84600000),
      duration: 1800,
      tokensSpent: 20,
      trainsOperated: ['Mountain Express'],
      totalDistance: 8.3,
      achievements: [],
      status: 'completed',
      events: [
        { id: 'e6', timestamp: new Date(Date.now() - 86400000), type: 'train_start', description: 'Started Mountain Express', trainId: 'T3', level: 1 },
        { id: 'e7', timestamp: new Date(Date.now() - 85800000), type: 'crossing_activated', description: 'Main Street crossing activated', level: 1 },
        { id: 'e8', timestamp: new Date(Date.now() - 84600000), type: 'train_stop', description: 'Stopped Mountain Express', trainId: 'T3', level: 1 },
      ]
    },
    {
      id: 'session-3',
      startTime: new Date(Date.now() - 172800000),
      endTime: new Date(Date.now() - 171900000),
      duration: 900,
      tokensSpent: 15,
      trainsOperated: ['City Limited', 'Valley Runner', 'Mountain Express'],
      totalDistance: 15.7,
      achievements: ['Multi-Train Master'],
      status: 'emergency_stopped',
      events: [
        { id: 'e9', timestamp: new Date(Date.now() - 172800000), type: 'train_start', description: 'Started all 3 trains', level: 2 },
        { id: 'e10', timestamp: new Date(Date.now() - 172200000), type: 'achievement', description: 'Earned "Multi-Train Master"' },
        { id: 'e11', timestamp: new Date(Date.now() - 171900000), type: 'emergency', description: 'Emergency stop activated' },
      ]
    },
  ];

  const achievements = [
    { id: 'a1', name: 'First Run', description: 'Complete your first session', icon: '🎉', earned: true, earnedDate: new Date(Date.now() - 604800000) },
    { id: 'a2', name: 'Speed Demon', description: 'Run a train at max speed for 5 minutes', icon: '⚡', earned: true, earnedDate: new Date(Date.now() - 3600000) },
    { id: 'a3', name: 'Junction Master', description: 'Switch 50 junctions', icon: '🔀', earned: true, earnedDate: new Date(Date.now() - 86400000) },
    { id: 'a4', name: 'Night Owl', description: 'Run trains between 12am-4am', icon: '🦉', earned: false },
    { id: 'a5', name: 'Multi-Train Master', description: 'Operate all 3 trains simultaneously', icon: '🚂', earned: true, earnedDate: new Date(Date.now() - 172800000) },
    { id: 'a6', name: 'Photographer', description: 'Capture 100 snapshots', icon: '📸', earned: false },
    { id: 'a7', name: 'Marathon Runner', description: 'Accumulate 100km of train distance', icon: '🏃', earned: false },
    { id: 'a8', name: 'Early Bird', description: 'Start a session before 6am', icon: '🌅', earned: false },
    { id: 'a9', name: 'Crossing Guard', description: 'Activate crossings 200 times', icon: '🚧', earned: false },
    { id: 'a10', name: 'Tunnel Explorer', description: 'Send trains through tunnels 500 times', icon: '🕳️', earned: false },
  ];

  const weeklyStats: DailyStats[] = [
    { date: new Date(Date.now() - 518400000), sessions: 3, totalDuration: 5400, tokensSpent: 45, distance: 28.5 },
    { date: new Date(Date.now() - 432000000), sessions: 2, totalDuration: 3600, tokensSpent: 30, distance: 18.2 },
    { date: new Date(Date.now() - 345600000), sessions: 4, totalDuration: 7200, tokensSpent: 60, distance: 42.1 },
    { date: new Date(Date.now() - 259200000), sessions: 1, totalDuration: 1800, tokensSpent: 15, distance: 9.8 },
    { date: new Date(Date.now() - 172800000), sessions: 2, totalDuration: 2700, tokensSpent: 35, distance: 24.0 },
    { date: new Date(Date.now() - 86400000), sessions: 3, totalDuration: 5400, tokensSpent: 55, distance: 31.5 },
    { date: new Date(), sessions: 2, totalDuration: 3600, tokensSpent: 45, distance: 21.0 },
  ];

  const totalStats = {
    sessions: sessions.length,
    duration: sessions.reduce((acc, s) => acc + s.duration, 0),
    tokens: sessions.reduce((acc, s) => acc + s.tokensSpent, 0),
    distance: sessions.reduce((acc, s) => acc + s.totalDistance, 0),
    achievements: achievements.filter(a => a.earned).length,
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const getEventIcon = (type: SessionEvent['type']) => {
    switch (type) {
      case 'train_start': return '🚂';
      case 'train_stop': return '🛑';
      case 'junction_switch': return '🔀';
      case 'crossing_activated': return '🚧';
      case 'snapshot': return '📸';
      case 'achievement': return '🏆';
      case 'emergency': return '🚨';
    }
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'interrupted': return '#f59e0b';
      case 'emergency_stopped': return '#ef4444';
    }
  };

  const tabs = [
    { id: 'sessions' as const, label: 'Sessions', icon: <HistoryIcon size={18} /> },
    { id: 'timeline' as const, label: 'Timeline', icon: <ActivityIcon size={18} /> },
    { id: 'stats' as const, label: 'Statistics', icon: <ChartIcon size={18} /> },
    { id: 'achievements' as const, label: 'Achievements', icon: <TrophyIcon size={18} /> },
  ];

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
            <p className="text-xs text-gray-500 mt-0.5">{totalStats.sessions} sessions • {formatDuration(totalStats.duration)} total</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>

          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
            <DownloadIcon size={16} />
            <span className="text-sm">Export</span>
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
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
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
        {/* Sessions List */}
        {activeTab === 'sessions' && (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                {/* Session Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-all"
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${getStatusColor(session.status)}15` }}
                    >
                      <TrainIcon size={24} style={{ color: getStatusColor(session.status) }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{session.startTime.toLocaleDateString()}</span>
                        <span 
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase"
                          style={{ 
                            backgroundColor: `${getStatusColor(session.status)}20`,
                            color: getStatusColor(session.status)
                          }}
                        >
                          {session.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{formatDuration(session.duration)}</span>
                        <span>•</span>
                        <span>{session.trainsOperated.length} trains</span>
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
                      className={`text-gray-500 transition-transform ${expandedSession === session.id ? 'rotate-180' : ''}`} 
                    />
                  </div>
                </div>

                {/* Expanded Events */}
                {expandedSession === session.id && (
                  <div className="border-t border-white/[0.06] bg-black/20 p-4">
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
                    
                    {session.achievements.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/[0.06]">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Achievements Earned</div>
                        <div className="flex gap-2">
                          {session.achievements.map(a => (
                            <span key={a} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium">
                              🏆 {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timeline View */}
        {activeTab === 'timeline' && (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />
            
            <div className="space-y-6">
              {sessions.flatMap(s => s.events).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20).map((event, i) => (
                <div key={event.id} className="flex items-start gap-4 pl-4">
                  <div 
                    className="w-5 h-5 rounded-full bg-[#0c0c14] border-2 flex items-center justify-center z-10 text-xs"
                    style={{ borderColor: event.type === 'emergency' ? '#ef4444' : event.type === 'achievement' ? '#f59e0b' : '#22c55e' }}
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
          </div>
        )}

        {/* Statistics */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Sessions', value: totalStats.sessions, icon: '🎮', color: '#00f0ff' },
                { label: 'Time Played', value: formatDuration(totalStats.duration), icon: '⏱️', color: '#a855f7' },
                { label: 'Tokens Spent', value: totalStats.tokens, icon: '🪙', color: '#f59e0b' },
                { label: 'Distance', value: `${totalStats.distance.toFixed(1)} km`, icon: '📏', color: '#22c55e' },
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

            {/* Weekly Chart */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <h4 className="font-semibold mb-4">Weekly Activity</h4>
              <div className="flex items-end justify-between gap-2 h-32">
                {weeklyStats.map((day, i) => {
                  const maxDuration = Math.max(...weeklyStats.map(d => d.totalDuration));
                  const height = (day.totalDuration / maxDuration) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all hover:from-cyan-400 hover:to-cyan-300"
                        style={{ height: `${height}%`, minHeight: day.sessions > 0 ? '8px' : '0' }}
                      />
                      <span className="text-[10px] text-gray-500">
                        {day.date.toLocaleDateString([], { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Train Stats */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <h4 className="font-semibold mb-4">Most Used Trains</h4>
              <div className="space-y-3">
                {[
                  { name: 'Valley Runner', runs: 15, distance: 45.2, color: '#22c55e' },
                  { name: 'City Limited', runs: 12, distance: 38.7, color: '#3b82f6' },
                  { name: 'Mountain Express', runs: 8, distance: 28.3, color: '#a855f7' },
                ].map((train, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: train.color }}
                    />
                    <span className="flex-1 font-medium text-sm">{train.name}</span>
                    <span className="text-xs text-gray-500">{train.runs} runs</span>
                    <span className="text-xs text-cyan-400">{train.distance} km</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <span className="text-amber-400 font-semibold">{achievements.filter(a => a.earned).length}</span>
                <span> / {achievements.length} achievements earned</span>
              </div>
              <div className="text-xs text-gray-500">
                {Math.round((achievements.filter(a => a.earned).length / achievements.length) * 100)}% complete
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id}
                  className={`
                    p-4 rounded-xl border transition-all
                    ${achievement.earned 
                      ? 'bg-amber-500/5 border-amber-500/20' 
                      : 'bg-white/[0.01] border-white/[0.06] opacity-60'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                        ${achievement.earned ? 'bg-amber-500/20' : 'bg-white/5 grayscale'}
                      `}
                    >
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{achievement.name}</span>
                        {achievement.earned && (
                          <span className="text-amber-400 text-xs">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                      {achievement.earned && achievement.earnedDate && (
                        <p className="text-[10px] text-amber-400/60 mt-2">
                          Earned {achievement.earnedDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
