'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { TokenDisplay, SessionTimer, ArcadeButton, KeyboardShortcutsModal, ConfirmDialog, useToast } from '@/components/ui';
import { useSounds } from '@/hooks/useSounds';
import { useGameSession } from '@/hooks/useGameSession';
import { GameHUD, GameOverScreen } from '@/components/GameHUD';
import { GameModeSelector } from '@/components/GameModeSelector';
import { GameModeId, GAME_MODE_CONFIGS } from '@/lib/game-modes/GameModeEngine';
import {
  GamepadIcon, WalletIcon, TrophyIcon, SparklesIcon,
  TrainIcon, EmergencyIcon, GearIcon, GridIcon, MenuIcon, CloseIcon,
  MapIcon, LayersIcon, TreeIcon, SunIcon, CameraIcon, CalendarIcon,
  ActivityIcon, PowerIcon, WifiIcon, BatteryIcon, SensorIcon, CoinsIcon,
  HistoryIcon, ImageIcon
} from '@/components/icons';
import { UserMenu } from '@/components/auth/UserMenu';
import { TrainTrackingModule } from '@/components/TrainTrackingModule';
import { PoliceStationModule } from '@/components/PoliceStationModule';
import {
  FireStationModule,
  CafeModule,
  SmartHomeModule,
  ConstructionZoneModule,
  DiamondCrossingModule
} from '@/components/Modules';
import { LiveTrackLayout } from '@/components/LiveTrackLayout';
import { SceneryControl } from '@/components/SceneryControl';
import { SensorManagement } from '@/components/SensorManagement';
import { TokenStore } from '@/components/TokenStore';
import { SnapshotGallery } from '@/components/SnapshotGallery';
import { SessionHistory } from '@/components/SessionHistory';
import { StreamingPanel } from '@/components/StreamingPanel';
import { ModeToggle, ViewOnlyBadge } from '@/components/ModeToggle';
import { useGameMode } from '@/lib/contexts/ModeContext';
import { useUser, useUnlockModule, useStartSession } from '@/hooks/useUser';
import { MODULE_COSTS } from '@/lib/pricing';

// ========================================
// MAIN ARCADE PAGE
// ========================================
export default function RailroadArcadePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RailroadArcade />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
          <TrainIcon size={32} className="text-white" />
        </div>
        <p className="text-gray-400">Loading Railroad Arcade...</p>
      </div>
    </div>
  );
}

// Handle search params in a separate component wrapped in Suspense
function SearchParamsHandler({ onShowTokenStore }: { onShowTokenStore: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('showTokenStore') === 'true') {
      onShowTokenStore();
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams, onShowTokenStore]);

  return null;
}

function RailroadArcade() {
  const { mode, isTokenRequired } = useGameMode();
  const {
    user,
    tokens,
    unlockedModules,
    isLoading,
    isAuthenticated,
    refetch,
    updateTokens,
    addUnlockedModule
  } = useUser();
  const { unlockModule: unlockModuleApi, isUnlocking } = useUnlockModule();
  const { startSession: startSessionApi, isStarting } = useStartSession();

  const [sessionTime, setSessionTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTokenStore, setShowTokenStore] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trains' | 'scenery' | 'buildings' | 'sensors' | 'camera' | 'streaming' | 'history' | 'gallery'>('overview');
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [showGameModeSelector, setShowGameModeSelector] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverResult, setGameOverResult] = useState<{
    isNewHighScore: boolean;
    previousHighScore: number;
    rank: number;
  } | null>(null);
  const { addToast } = useToast();
  const { play: playSound } = useSounds();

  // Game session hook
  const {
    gameState,
    isGameActive,
    currentMode,
    startGame,
    endGame,
    pauseGame,
    resumeGame,
    onJunctionSwitch,
    onLapComplete,
  } = useGameSession();

  // Auto-start in demo mode for seamless experience
  useEffect(() => {
    if (mode === 'demo' && !isPlaying && !hasAutoStarted) {
      setSessionTime(Infinity);
      setIsPlaying(true);
      setHasAutoStarted(true);
    }
  }, [mode, isPlaying, hasAutoStarted]);

  // Session timer countdown
  useEffect(() => {
    if (isPlaying && sessionTime > 0 && sessionTime !== Infinity) {
      const timer = setInterval(() => {
        setSessionTime(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, sessionTime]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for track events to update game scoring
  useEffect(() => {
    if (!isGameActive) return;

    const handleLapComplete = (e: CustomEvent) => {
      onLapComplete(e.detail.trainId);
    };

    const handleJunctionSwitch = (e: CustomEvent) => {
      onJunctionSwitch(e.detail.junctionId, e.detail.junctionName);
    };

    const handleNearMiss = (e: CustomEvent) => {
      // Near misses add to score but don't interrupt gameplay
      addToast('success', `Near miss! +50 points`);
    };

    window.addEventListener('railroad:lapComplete', handleLapComplete as EventListener);
    window.addEventListener('railroad:junctionSwitch', handleJunctionSwitch as EventListener);
    window.addEventListener('railroad:nearMiss', handleNearMiss as EventListener);

    return () => {
      window.removeEventListener('railroad:lapComplete', handleLapComplete as EventListener);
      window.removeEventListener('railroad:junctionSwitch', handleJunctionSwitch as EventListener);
      window.removeEventListener('railroad:nearMiss', handleNearMiss as EventListener);
    };
  }, [isGameActive, onLapComplete, onJunctionSwitch, addToast]);

  const handleEmergencyStop = () => {
    playSound('emergency');
    window.dispatchEvent(new CustomEvent('railroad:emergencyStop'));
    setShowEmergencyConfirm(false);
    addToast('warning', 'Emergency stop activated - all trains halted');
  };

  // Handle game mode selection
  const handleSelectGameMode = async (modeId: GameModeId) => {
    setShowGameModeSelector(false);

    const config = GAME_MODE_CONFIGS[modeId];
    const cost = mode === 'live' ? config.tokenCost : 0;
    const duration = config.duration || 600; // Default 10 min for unlimited modes

    // Start the play session for token tracking
    if (mode === 'live' && cost > 0) {
      if (!isAuthenticated) {
        setShowTokenStore(true);
        return;
      }
      if (tokens < cost) {
        setShowTokenStore(true);
        return;
      }

      try {
        await startSessionApi(duration, cost, (data) => {
          updateTokens(data.tokenBalance);
        });
      } catch (err) {
        console.error('Failed to start session:', err);
        return;
      }
    }

    // Start the game with selected mode
    const success = await startGame(modeId);
    if (success) {
      setSessionTime(config.duration || Infinity);
      setIsPlaying(true);
      setShowGameOver(false);
      setGameOverResult(null);
    }
  };

  // Handle game end
  const handleGameEnd = async () => {
    if (gameState) {
      // Submit score and get result
      try {
        const response = await fetch('/api/leaderboards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameMode: currentMode,
            score: gameState.score,
            isLive: mode === 'live',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setGameOverResult({
              isNewHighScore: data.data.newHighScore,
              previousHighScore: data.data.currentHighScore || 0,
              rank: data.data.rank || 0,
            });
          }
        }
      } catch (err) {
        console.error('Failed to submit score:', err);
      }
    }

    await endGame();
    setShowGameOver(true);
    setIsPlaying(false);
  };

  // Handle play again
  const handlePlayAgain = () => {
    setShowGameOver(false);
    setGameOverResult(null);
    if (currentMode) {
      handleSelectGameMode(currentMode);
    } else {
      setShowGameModeSelector(true);
    }
  };

  const startSession = async (duration: number, cost: number) => {
    // Show game mode selector instead of starting directly
    setShowGameModeSelector(true);
  };

  const unlockModule = async (moduleId: string, cost: number) => {
    // Demo mode: all modules free
    if (mode === 'demo') {
      playSound('unlock');
      addUnlockedModule(moduleId);
      return;
    }

    // Live mode: require authentication and tokens
    if (!isAuthenticated) {
      setShowTokenStore(true);
      return;
    }

    if (tokens < cost) {
      setShowTokenStore(true);
      return;
    }

    // Already unlocked
    if (unlockedModules.includes(moduleId)) {
      return;
    }

    try {
      await unlockModuleApi(moduleId, cost, (data) => {
        playSound('unlock');
        updateTokens(data.tokenBalance);
        addUnlockedModule(moduleId);
      });
    } catch (err) {
      playSound('error');
      console.error('Failed to unlock module:', err);
    }
  };

  const handleTokenPurchaseComplete = () => {
    refetch();
    setShowTokenStore(false);
  };

  const modules = [
    { id: 'trains', name: 'Train Tracking', cost: 0, color: '#00f0ff' },
    { id: 'scenery', name: 'Scenery Control', cost: 0, color: '#22c55e' },
    { id: 'police', name: 'Police Station', cost: 25, color: '#3b82f6' },
    { id: 'fire', name: 'Fire Station', cost: 25, color: '#ef4444' },
    { id: 'cafe', name: 'Café', cost: 15, color: '#f59e0b' },
    { id: 'home', name: 'Smart Home', cost: 20, color: '#a855f7' },
    { id: 'construction', name: 'Construction Zone', cost: 30, color: '#eab308' },
    { id: 'crossing', name: 'Diamond Crossing', cost: 20, color: '#22c55e' },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: <GridIcon size={18} /> },
    { id: 'trains' as const, label: 'Trains', icon: <TrainIcon size={18} /> },
    { id: 'scenery' as const, label: 'Scenery', icon: <TreeIcon size={18} /> },
    { id: 'buildings' as const, label: 'Buildings', icon: <LayersIcon size={18} /> },
    { id: 'sensors' as const, label: 'Sensors', icon: <SensorIcon size={18} /> },
    { id: 'camera' as const, label: 'Camera', icon: <CameraIcon size={18} /> },
    { id: 'streaming' as const, label: 'Stream', icon: <ActivityIcon size={18} /> },
    { id: 'gallery' as const, label: 'Gallery', icon: <ImageIcon size={18} /> },
    { id: 'history' as const, label: 'History', icon: <HistoryIcon size={18} /> },
  ];

  return (
    <div className="min-h-screen relative z-10">
      {/* Search params handler for URL state */}
      <Suspense fallback={null}>
        <SearchParamsHandler onShowTokenStore={() => setShowTokenStore(true)} />
      </Suspense>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <TrainIcon size={24} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0a0a0f] flex items-center justify-center">
                  <span className="text-[8px]">✓</span>
                </div>
              </div>
              <div>
                <h1 
                  className="text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  RAILROAD ARCADE
                </h1>
                <p className="text-[10px] text-gray-500 tracking-widest uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Interactive Model Railroad
                </p>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-4">
              {/* Mode Toggle */}
              <ModeToggle />

              {/* Status indicators */}
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <WifiIcon size={14} />
                  <span className="text-xs">Online</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-1.5 text-amber-400">
                  <BatteryIcon size={14} />
                  <span className="text-xs">98%</span>
                </div>
              </div>

              {isPlaying && sessionTime !== Infinity && <SessionTimer seconds={sessionTime} />}
              {mode === 'live' && (
                <TokenDisplay amount={tokens} onAddTokens={() => setShowTokenStore(true)} />
              )}
              {mode === 'demo' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm">
                  <SparklesIcon size={14} />
                  <span className="font-medium">Free Demo Mode</span>
                </div>
              ) : !isPlaying ? (
                <ArcadeButton
                  variant="primary"
                  onClick={() => startSession(120, 10)}
                  disabled={tokens < 10}
                >
                  <GamepadIcon size={18} />
                  Start Session
                </ArcadeButton>
              ) : (
                <ArcadeButton variant="danger" onClick={() => setShowEmergencyConfirm(true)}>
                  <EmergencyIcon size={18} />
                  STOP
                </ArcadeButton>
              )}
              <a
                href="/leaderboards"
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors"
                title="Leaderboards"
              >
                <TrophyIcon size={20} />
              </a>
              <UserMenu />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-2 border-t border-white/10 pt-4 space-y-3">
              {/* Mode Toggle */}
              <div className="flex justify-center pb-3 border-b border-white/10">
                <ModeToggle />
              </div>
              <div className="flex items-center justify-between">
                {mode === 'live' && (
                  <TokenDisplay amount={tokens} onAddTokens={() => setShowTokenStore(true)} />
                )}
                {isPlaying && sessionTime !== Infinity && <SessionTimer seconds={sessionTime} />}
              </div>
              {mode === 'demo' ? (
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                  <SparklesIcon size={18} />
                  <span className="font-medium">Free Demo Mode - All Features Unlocked</span>
                </div>
              ) : !isPlaying ? (
                <ArcadeButton
                  variant="primary"
                  className="w-full"
                  onClick={() => { startSession(120, 10); setMobileMenuOpen(false); }}
                  disabled={tokens < 10}
                >
                  <GamepadIcon size={18} />
                  Start Session (10 tokens / 2 min)
                </ArcadeButton>
              ) : (
                <ArcadeButton variant="danger" className="w-full">
                  <EmergencyIcon size={18} />
                  EMERGENCY STOP
                </ArcadeButton>
              )}
              <div className="pt-2 border-t border-white/10">
                <UserMenu />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Welcome Banner (when not playing) */}
      {!isPlaying && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-b border-white/10">
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-10 lg:py-12 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs sm:text-sm mb-3 sm:mb-4">
                  <SparklesIcon size={14} />
                  <span>Now Live & Interactive</span>
                </div>
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-200"
                  style={{ fontFamily: 'Orbitron, sans-serif', lineHeight: 1.1 }}
                >
                  Control a Real<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                    Model Railroad
                  </span>
                </h2>
                <p className="text-gray-400 mb-4 sm:mb-6 max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed">
                  Experience the magic of a 2-level HO scale railroad with 3 trains, 
                  interactive buildings, stunning scenery, and real-time control from anywhere in the world.
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <ArcadeButton variant="primary" size="lg" onClick={() => startSession(120, 10)} disabled={tokens < 10}>
                    <GamepadIcon size={20} />
                    Start Playing
                  </ArcadeButton>
                  <ArcadeButton variant="ghost" size="lg" onClick={() => setShowTokenStore(true)}>
                    <WalletIcon size={20} />
                    Get Tokens
                  </ArcadeButton>
                </div>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-6 mt-8 justify-center lg:justify-start">
                  {[
                    { label: '3 Trains', value: 'Active' },
                    { label: '2 Levels', value: 'Connected' },
                    { label: '7 Buildings', value: 'Interactive' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center lg:text-left">
                      <div className="text-2xl font-bold text-white">{stat.label}</div>
                      <div className="text-sm text-gray-500">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Preview Card */}
              <div className="hidden lg:block w-96">
                <div className="relative rounded-2xl overflow-hidden bg-[#1a1a24] border border-white/10 shadow-2xl">
                  <div className="h-48 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center animate-pulse">
                        <TrainIcon size={48} className="text-cyan-400" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Live Preview</span>
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation (when playing) */}
      {isPlaying && (
        <div className="sticky top-[57px] sm:top-[65px] md:top-[73px] z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex items-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all min-h-[44px]
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-white/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <span className={activeTab === tab.id ? 'text-cyan-400' : ''}>{tab.icon}</span>
                  <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-cyan-400 rounded-full sm:hidden" />
                  )}
                </button>
              ))}
              
              <div className="flex-1" />
              
              {/* Quick stats */}
              <div className="hidden md:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <ActivityIcon size={14} className="text-emerald-400" />
                  <span>3 trains active</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <SunIcon size={14} className="text-amber-400" />
                  <span>Day mode</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {isPlaying ? (
          <div>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Live Track Layout */}
                <LiveTrackLayout />

                {/* Quick Access Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {modules.slice(0, 4).map(mod => {
                    const isDemo = mode === 'demo';
                    const isUnlocked = isDemo || unlockedModules.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        onClick={() => !isUnlocked && unlockModule(mod.id, mod.cost)}
                        className={`
                          relative p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all text-left min-h-[70px]
                          ${isUnlocked
                            ? 'bg-white/5 border-white/20 hover:bg-white/10'
                            : 'bg-white/5 border-white/10 opacity-60'
                          }
                        `}
                        style={{ borderLeftColor: mod.color, borderLeftWidth: 3 }}
                      >
                        <div className="text-xs sm:text-sm font-medium mb-1 line-clamp-1">{mod.name}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">
                          {isDemo ? (
                            <span className="text-purple-400">Free in Demo</span>
                          ) : isUnlocked ? 'Active' : `${mod.cost} tokens to unlock`}
                        </div>
                        {!isUnlocked && (
                          <div className="absolute top-2 right-2 text-lg">🔒</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trains Tab */}
            {activeTab === 'trains' && (
              <div className="space-y-6">
                <LiveTrackLayout />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TrainTrackingModule locked={mode !== 'demo' && !unlockedModules.includes('trains')} onUnlock={() => unlockModule('trains', 0)} />
                  <DiamondCrossingModule locked={mode !== 'demo' && !unlockedModules.includes('crossing')} onUnlock={() => unlockModule('crossing', 20)} />
                </div>
              </div>
            )}

            {/* Scenery Tab */}
            {activeTab === 'scenery' && (
              <SceneryControl locked={mode !== 'demo' && !unlockedModules.includes('scenery')} onUnlock={() => unlockModule('scenery', 0)} />
            )}

            {/* Buildings Tab */}
            {activeTab === 'buildings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <PoliceStationModule locked={mode !== 'demo' && !unlockedModules.includes('police')} onUnlock={() => unlockModule('police', 25)} />
                <FireStationModule locked={mode !== 'demo' && !unlockedModules.includes('fire')} onUnlock={() => unlockModule('fire', 25)} />
                <CafeModule locked={mode !== 'demo' && !unlockedModules.includes('cafe')} onUnlock={() => unlockModule('cafe', 15)} />
                <SmartHomeModule locked={mode !== 'demo' && !unlockedModules.includes('home')} onUnlock={() => unlockModule('home', 20)} />
                <ConstructionZoneModule locked={mode !== 'demo' && !unlockedModules.includes('construction')} onUnlock={() => unlockModule('construction', 30)} />
              </div>
            )}

            {/* Camera Tab */}
            {activeTab === 'camera' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Camera Feed */}
                <div className="rounded-2xl border border-white/10 bg-[#0c0c14] overflow-hidden lg:col-span-2">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <CameraIcon size={20} className="text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Live Camera Feed</h3>
                        <p className="text-xs text-gray-400">Overhead view • 1080p</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        LIVE
                      </span>
                    </div>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="text-center">
                      <CameraIcon size={48} className="text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500">Camera feed connecting...</p>
                      <p className="text-xs text-gray-600 mt-1">Stream will appear when available</p>
                    </div>
                  </div>
                </div>

                {/* Camera Selection */}
                <div className="rounded-2xl border border-white/10 bg-[#0c0c14] p-4">
                  <h4 className="font-medium mb-3">Camera Views</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Overhead', 'Station 1', 'Station 2', 'Tunnel Entry'].map((cam, i) => (
                      <button key={cam} className={`p-3 rounded-xl border text-sm ${i === 0 ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                        {cam}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recording Controls */}
                <div className="rounded-2xl border border-white/10 bg-[#0c0c14] p-4">
                  <h4 className="font-medium mb-3">Recording</h4>
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-medium">
                      ⏺ Record
                    </button>
                    <button className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400">
                      📷 Snapshot
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sensors Tab */}
            {activeTab === 'sensors' && (
              <SensorManagement />
            )}

            {/* Streaming Tab */}
            {activeTab === 'streaming' && (
              <StreamingPanel />
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <SnapshotGallery />
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <SessionHistory />
            )}
          </div>
        ) : (
          /* Station Selection Grid (when not playing) */
          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <GridIcon size={18} className="text-cyan-400 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Interactive Modules
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">Unlock and control different areas</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {modules.map(mod => (
                <StationCard 
                  key={mod.id}
                  name={mod.name}
                  cost={mod.cost}
                  color={mod.color}
                  unlocked={unlockedModules.includes(mod.id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Token Store Modal */}
      {showTokenStore && (
        <TokenStore
          currentTokens={tokens}
          onPurchaseComplete={handleTokenPurchaseComplete}
          onClose={() => setShowTokenStore(false)}
        />
      )}

      {/* Emergency Stop Button (fixed) */}
      {isPlaying && (
        <button
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 group"
          onClick={() => setShowEmergencyConfirm(true)}
          aria-label="Emergency stop - halt all trains"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-red-500 to-red-700 flex flex-col items-center justify-center text-white shadow-lg shadow-red-500/50 border-4 border-red-400/30 group-hover:scale-105 transition-transform">
              <EmergencyIcon size={28} />
              <span className="text-[8px] uppercase tracking-wider mt-0.5 font-bold">STOP</span>
            </div>
          </div>
        </button>
      )}

      {/* Emergency Stop Confirmation */}
      <ConfirmDialog
        isOpen={showEmergencyConfirm}
        title="Emergency Stop"
        message="This will halt all trains immediately. Are you sure?"
        confirmLabel="Stop All Trains"
        variant="danger"
        onConfirm={handleEmergencyStop}
        onCancel={() => setShowEmergencyConfirm(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* Game HUD */}
      {isGameActive && gameState && (
        <GameHUD
          gameState={gameState}
          onPause={pauseGame}
          onResume={resumeGame}
          onEnd={handleGameEnd}
        />
      )}

      {/* Game Mode Selector Modal */}
      {showGameModeSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <GameModeSelector
              onSelectMode={handleSelectGameMode}
              currentMode={currentMode}
            />
            <button
              onClick={() => setShowGameModeSelector(false)}
              className="mt-4 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {showGameOver && gameState && (
        <GameOverScreen
          gameState={gameState}
          isNewHighScore={gameOverResult?.isNewHighScore}
          previousHighScore={gameOverResult?.previousHighScore}
          rank={gameOverResult?.rank}
          onPlayAgain={handlePlayAgain}
          onChangeMode={() => {
            setShowGameOver(false);
            setShowGameModeSelector(true);
          }}
          onViewLeaderboard={() => {
            setShowGameOver(false);
            window.location.href = '/leaderboards';
          }}
          onExit={() => {
            setShowGameOver(false);
            setIsPlaying(false);
          }}
        />
      )}
    </div>
  );
}

// ========================================
// STATION CARD COMPONENT
// ========================================
function StationCard({
  name,
  cost,
  color,
  unlocked
}: {
  name: string;
  cost: number;
  color: string;
  unlocked: boolean;
}) {
  return (
    <div
      className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#1a1a24] border border-white/10 hover:border-opacity-50 transition-all duration-300 cursor-pointer hover:-translate-y-1 active:scale-[0.98]"
      style={{
        '--station-color': color,
        borderColor: `${color}30`,
      } as React.CSSProperties}
    >
      {/* Preview area */}
      <div className="h-24 sm:h-32 md:h-36 bg-gradient-to-b from-sky-100 to-sky-200 relative overflow-hidden">
        {/* Placeholder illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl opacity-50"
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Locked overlay */}
        {!unlocked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl">🔒</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3 md:p-4" style={{ borderTop: `3px solid ${color}` }}>
        <h3 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-1">{name}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400 text-xs sm:text-sm font-medium">
            {cost === 0 ? (
              <span className="text-emerald-400">FREE</span>
            ) : (
              <>
                <span>⬡</span>
                <span>{cost}</span>
              </>
            )}
          </div>
          {unlocked && (
            <span className="text-[10px] sm:text-xs text-emerald-400 font-medium">UNLOCKED</span>
          )}
        </div>
      </div>
    </div>
  );
}
