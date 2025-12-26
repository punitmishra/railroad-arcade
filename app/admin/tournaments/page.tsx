'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArcadeButton } from '@/components/ui';
import { TrophyIcon, RefreshIcon, EyeIcon, TrashIcon, PlayIcon, PlusIcon, UsersIcon, CoinsIcon, LockIcon } from '@/components/icons';
import { TOURNAMENT_TYPES, DEFAULT_PRIZE_TIERS, TournamentPrize } from '@/lib/tournament';

// ============================================
// Admin Key Management (Session-based)
// ============================================
function getAdminKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_key') || '';
}

function setAdminKey(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('admin_key', key);
}

function clearAdminKey(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('admin_key');
}

// ============================================
// Types
// ============================================

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  type: 'DAILY' | 'WEEKLY' | 'SPECIAL' | 'CHAMPIONSHIP';
  status: 'SCHEDULED' | 'REGISTRATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  gameMode: string;
  registrationStart: string;
  registrationEnd: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  entryFee: number;
  minLevel: number;
  attemptsPerPlayer: number;
  prizePool: number;
  prizes: TournamentPrize[];
  participantCount: number;
}

// ============================================
// Admin Tournament Management Page
// ============================================

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');

  // Fetch tournaments
  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tournaments?status=all&limit=50');
      const data = await response.json();

      if (data.success) {
        setTournaments(data.tournaments || []);
      } else {
        setError(data.error || 'Failed to fetch tournaments');
      }
    } catch (err) {
      setError('Failed to fetch tournaments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for stored admin key on mount
  useEffect(() => {
    const storedKey = getAdminKey();
    if (storedKey) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Fetch tournaments when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchTournaments();
    }
  }, [fetchTournaments, isAuthenticated]);

  // Handle admin login
  const handleLogin = () => {
    if (adminKeyInput.trim()) {
      setAdminKey(adminKeyInput.trim());
      setIsAuthenticated(true);
      setAdminKeyInput('');
    }
  };

  // Handle admin logout
  const handleLogout = () => {
    clearAdminKey();
    setIsAuthenticated(false);
    setTournaments([]);
  };

  // Cancel tournament
  const handleCancel = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to cancel this tournament? All entry fees will be refunded.')) {
      return;
    }

    setActionLoading(tournamentId);
    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': getAdminKey(),
        },
      });

      const data = await response.json();

      if (data.success) {
        await fetchTournaments();
      } else {
        alert(data.error || 'Failed to cancel tournament');
      }
    } catch (err) {
      alert('Failed to cancel tournament');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Finalize tournament
  const handleFinalize = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to finalize this tournament early? This will calculate final ranks and distribute prizes.')) {
      return;
    }

    setActionLoading(tournamentId);
    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/finalize`, {
        method: 'POST',
        headers: {
          'x-admin-key': getAdminKey(),
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('Tournament finalization queued successfully');
        await fetchTournaments();
      } else {
        alert(data.error || 'Failed to finalize tournament');
      }
    } catch (err) {
      alert('Failed to finalize tournament');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Create tournament
  const handleCreate = async (formData: CreateTournamentData) => {
    setActionLoading('create');
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': getAdminKey(),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateForm(false);
        await fetchTournaments();
      } else {
        alert(data.error || 'Failed to create tournament');
      }
    } catch (err) {
      alert('Failed to create tournament');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Get status badge color
  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'REGISTRATION':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'COMPLETED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <LockIcon className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Admin Access</h1>
          <p className="text-gray-400 text-center text-sm mb-6">
            Enter your admin key to manage tournaments
          </p>
          <div className="space-y-4">
            <input
              type="password"
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter admin key"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              autoFocus
            />
            <ArcadeButton
              variant="primary"
              className="w-full"
              onClick={handleLogin}
              disabled={!adminKeyInput.trim()}
            >
              Authenticate
            </ArcadeButton>
          </div>
          <p className="text-gray-500 text-xs text-center mt-4">
            Your key is stored in session only and cleared when you close the browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tournament Management</h1>
              <p className="text-gray-400 text-sm">Create, manage, and monitor tournaments</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ArcadeButton
              variant="ghost"
              onClick={handleLogout}
              title="Sign out"
            >
              <LockIcon className="w-4 h-4" />
              Sign Out
            </ArcadeButton>
            <ArcadeButton
              variant="ghost"
              onClick={fetchTournaments}
              disabled={isLoading}
            >
              <RefreshIcon className="w-4 h-4" />
              Refresh
            </ArcadeButton>
            <ArcadeButton
              variant="primary"
              onClick={() => setShowCreateForm(true)}
            >
              <PlusIcon className="w-4 h-4" />
              Create Tournament
            </ArcadeButton>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Tournaments Grid */}
        {!isLoading && tournaments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <TrophyIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tournaments found</p>
            <p className="text-sm">Create your first tournament to get started</p>
          </div>
        )}

        {!isLoading && tournaments.length > 0 && (
          <div className="grid gap-4">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-md border"
                        style={{
                          backgroundColor: `${TOURNAMENT_TYPES[tournament.type].color}20`,
                          borderColor: `${TOURNAMENT_TYPES[tournament.type].color}40`,
                          color: TOURNAMENT_TYPES[tournament.type].color,
                        }}
                      >
                        {TOURNAMENT_TYPES[tournament.type].icon} {tournament.type}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(tournament.status)}`}>
                        {tournament.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {tournament.gameMode}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{tournament.name}</h3>
                    {tournament.description && (
                      <p className="text-gray-400 text-sm mb-3">{tournament.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <UsersIcon className="w-4 h-4" />
                        {tournament.participantCount}/{tournament.maxParticipants}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CoinsIcon className="w-4 h-4" />
                        {tournament.entryFee} tokens entry
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CoinsIcon className="w-4 h-4 text-amber-400" />
                        {tournament.prizePool} prize pool
                      </div>
                      <div className="text-gray-500">
                        Starts: {new Date(tournament.startTime).toLocaleString()}
                      </div>
                      <div className="text-gray-500">
                        Ends: {new Date(tournament.endTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <ArcadeButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTournament(tournament)}
                      title="View Details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </ArcadeButton>
                    {tournament.status === 'ACTIVE' && (
                      <ArcadeButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleFinalize(tournament.id)}
                        disabled={actionLoading === tournament.id}
                        title="Finalize Early"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </ArcadeButton>
                    )}
                    {!['COMPLETED', 'CANCELLED'].includes(tournament.status) && (
                      <ArcadeButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancel(tournament.id)}
                        disabled={actionLoading === tournament.id}
                        title="Cancel Tournament"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </ArcadeButton>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreateForm && (
        <CreateTournamentModal
          onClose={() => setShowCreateForm(false)}
          onCreate={handleCreate}
          isLoading={actionLoading === 'create'}
        />
      )}

      {/* Tournament Details Modal */}
      {selectedTournament && (
        <TournamentDetailsModal
          tournament={selectedTournament}
          onClose={() => setSelectedTournament(null)}
        />
      )}
    </div>
  );
}

// ============================================
// Create Tournament Modal
// ============================================

interface CreateTournamentData {
  name: string;
  description: string;
  type: string;
  gameMode: string;
  registrationStart: string;
  registrationEnd: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  entryFee: number;
  minLevel: number;
  attemptsPerPlayer: number;
  prizePool: number;
  prizes: TournamentPrize[];
}

function CreateTournamentModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (data: CreateTournamentData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateTournamentData>({
    name: '',
    description: '',
    type: 'WEEKLY',
    gameMode: 'SPEED_RUN',
    registrationStart: new Date().toISOString().slice(0, 16),
    registrationEnd: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16),
    maxParticipants: 100,
    entryFee: 10,
    minLevel: 1,
    attemptsPerPlayer: 3,
    prizePool: 1500,
    prizes: DEFAULT_PRIZE_TIERS,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">Create Tournament</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="SPECIAL">Special</option>
                <option value="CHAMPIONSHIP">Championship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Game Mode</label>
              <select
                value={formData.gameMode}
                onChange={(e) => setFormData({ ...formData, gameMode: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="SPEED_RUN">Speed Run</option>
                <option value="DELIVERY_MISSION">Delivery Mission</option>
                <option value="SURVIVAL">Survival</option>
                <option value="TIME_ATTACK">Time Attack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Registration Start</label>
              <input
                type="datetime-local"
                value={formData.registrationStart}
                onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Registration End</label>
              <input
                type="datetime-local"
                value={formData.registrationEnd}
                onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Time</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Participants</label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Entry Fee (tokens)</label>
              <input
                type="number"
                value={formData.entryFee}
                onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Min Level</label>
              <input
                type="number"
                value={formData.minLevel}
                onChange={(e) => setFormData({ ...formData, minLevel: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                min={1}
                max={5}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Attempts Per Player</label>
              <input
                type="number"
                value={formData.attemptsPerPlayer}
                onChange={(e) => setFormData({ ...formData, attemptsPerPlayer: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prize Pool (tokens)</label>
              <input
                type="number"
                value={formData.prizePool}
                onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                min={0}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <ArcadeButton variant="ghost" type="button" onClick={onClose}>
              Cancel
            </ArcadeButton>
            <ArcadeButton variant="primary" type="submit" loading={isLoading}>
              Create Tournament
            </ArcadeButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Tournament Details Modal
// ============================================

function TournamentDetailsModal({
  tournament,
  onClose,
}: {
  tournament: Tournament;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">{tournament.name}</h2>
          <ArcadeButton variant="ghost" size="sm" onClick={onClose}>
            Close
          </ArcadeButton>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Type:</span>
              <span className="ml-2">{tournament.type}</span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="ml-2">{tournament.status}</span>
            </div>
            <div>
              <span className="text-gray-400">Game Mode:</span>
              <span className="ml-2">{tournament.gameMode}</span>
            </div>
            <div>
              <span className="text-gray-400">Participants:</span>
              <span className="ml-2">{tournament.participantCount}/{tournament.maxParticipants}</span>
            </div>
            <div>
              <span className="text-gray-400">Entry Fee:</span>
              <span className="ml-2">{tournament.entryFee} tokens</span>
            </div>
            <div>
              <span className="text-gray-400">Prize Pool:</span>
              <span className="ml-2">{tournament.prizePool} tokens</span>
            </div>
            <div>
              <span className="text-gray-400">Min Level:</span>
              <span className="ml-2">Level {tournament.minLevel}</span>
            </div>
            <div>
              <span className="text-gray-400">Attempts:</span>
              <span className="ml-2">{tournament.attemptsPerPlayer} per player</span>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="font-semibold mb-3">Schedule</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Registration Start:</span>
                <div>{new Date(tournament.registrationStart).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-400">Registration End:</span>
                <div>{new Date(tournament.registrationEnd).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-400">Start Time:</span>
                <div>{new Date(tournament.startTime).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-400">End Time:</span>
                <div>{new Date(tournament.endTime).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {tournament.prizes && tournament.prizes.length > 0 && (
            <div className="border-t border-gray-800 pt-4">
              <h3 className="font-semibold mb-3">Prize Distribution</h3>
              <div className="space-y-2">
                {tournament.prizes.slice(0, 10).map((prize) => (
                  <div key={prize.rank} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {prize.rank === 1 ? '1st' : prize.rank === 2 ? '2nd' : prize.rank === 3 ? '3rd' : `${prize.rank}th`} Place
                    </span>
                    <div className="flex items-center gap-4">
                      <span>{prize.tokens} tokens</span>
                      {prize.badge && <span className="text-amber-400">{prize.badge}</span>}
                      {prize.title && <span className="text-purple-400">{prize.title}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
