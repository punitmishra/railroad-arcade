'use client';

import { useState, useEffect, useCallback } from 'react';
import { KioskTrainControl, EmergencyStopButton, JunctionToggle } from '@/components/kiosk/KioskTrainControl';
import { KioskCameraView } from '@/components/kiosk/KioskCameraView';
import { GameHUD, GameOverScreen } from '@/components/GameHUD';
import { GameModeSelector } from '@/components/GameModeSelector';
import { useGameControls } from '@/hooks/useArcadeInput';
import { useGameMode } from '@/lib/contexts/ModeContext';
import { createGameMode, GameModeEngine, GameModeId, GameState, GAME_MODE_CONFIGS } from '@/lib/game-modes/GameModeEngine';
import { DEFAULT_SESSION_CONFIG } from '@/lib/kiosk-config';

// ============================================
// Kiosk Page Component
// ============================================
// Fullscreen arcade cabinet mode

type KioskState = 'attract' | 'mode-select' | 'playing' | 'game-over';

export default function KioskPage() {
  const { mode } = useGameMode();
  const [kioskState, setKioskState] = useState<KioskState>('attract');
  const [gameEngine, setGameEngine] = useState<GameModeEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [tokens, setTokens] = useState(0);
  const [idleTime, setIdleTime] = useState(0);

  // Train state
  const [train1Speed, setTrain1Speed] = useState(0);
  const [train1Dir, setTrain1Dir] = useState<'forward' | 'reverse'>('forward');
  const [train2Speed, setTrain2Speed] = useState(0);
  const [train2Dir, setTrain2Dir] = useState<'forward' | 'reverse'>('forward');

  // Junction state
  const [junctions, setJunctions] = useState<Record<string, 'left' | 'right' | 'straight'>>({
    j1: 'straight',
    j2: 'straight',
    j3: 'straight',
  });

  // Reset idle timer on any interaction
  const resetIdle = useCallback(() => {
    setIdleTime(0);
  }, []);

  // Idle timeout for attract mode
  useEffect(() => {
    if (kioskState === 'playing') return;

    const interval = setInterval(() => {
      setIdleTime((prev) => {
        if (prev >= DEFAULT_SESSION_CONFIG.idleTimeout && kioskState !== 'attract') {
          setKioskState('attract');
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [kioskState]);

  // Update game state from engine
  useEffect(() => {
    if (!gameEngine) return;

    const interval = setInterval(() => {
      const state = gameEngine.getState();
      setGameState({ ...state });

      if (!state.isActive && kioskState === 'playing') {
        setKioskState('game-over');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameEngine, kioskState]);

  // Enter fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (e) {
        console.log('Fullscreen not supported or denied');
      }
    };
    enterFullscreen();
  }, []);

  // Arcade input handling
  useGameControls({
    onStart: () => {
      resetIdle();
      if (kioskState === 'attract') {
        setKioskState('mode-select');
      } else if (kioskState === 'mode-select') {
        // Start default mode
        handleStartGame('FREE_PLAY');
      }
    },
    onPause: () => {
      if (gameEngine && kioskState === 'playing') {
        if (gameEngine.getState().isPaused) {
          gameEngine.resume();
        } else {
          gameEngine.pause();
        }
      }
    },
    onModeSelect: () => {
      resetIdle();
      if (kioskState === 'attract' || kioskState === 'playing') {
        setKioskState('mode-select');
      }
    },
    onCoinInsert: () => {
      resetIdle();
      setTokens((prev) => prev + 1);
    },
  });

  const handleStartGame = (modeId: GameModeId) => {
    resetIdle();
    const config = GAME_MODE_CONFIGS[modeId];

    // Check if we need tokens (only in live mode)
    if (mode === 'live' && config.tokenCost > tokens) {
      // Not enough tokens - could show error
      return;
    }

    if (mode === 'live') {
      setTokens((prev) => prev - config.tokenCost);
    }

    const engine = createGameMode(modeId);
    engine.setOnStateChange((state) => setGameState({ ...state }));
    engine.start();
    setGameEngine(engine);
    setKioskState('playing');
  };

  const handleEmergencyStop = () => {
    setTrain1Speed(0);
    setTrain2Speed(0);
    gameEngine?.onCollision('train1', 'emergency-stop');
  };

  const handlePlayAgain = () => {
    const currentMode = gameEngine?.getState().mode;
    if (currentMode) {
      handleStartGame(currentMode);
    } else {
      setKioskState('mode-select');
    }
  };

  const handleExit = () => {
    setGameEngine(null);
    setGameState(null);
    setKioskState('attract');
  };

  const toggleJunction = (id: string) => {
    resetIdle();
    setJunctions((prev) => {
      const current = prev[id];
      const next = current === 'straight' ? 'left' : current === 'left' ? 'right' : 'straight';
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden select-none" onClick={resetIdle}>
      {/* Attract Mode */}
      {kioskState === 'attract' && (
        <AttractScreen tokens={tokens} onStart={() => setKioskState('mode-select')} />
      )}

      {/* Mode Selection */}
      {kioskState === 'mode-select' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-40">
          <div className="w-full max-w-2xl mx-4">
            <GameModeSelector onSelectMode={handleStartGame} />
            <button
              onClick={() => setKioskState('attract')}
              className="w-full mt-4 py-3 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Game Playing */}
      {kioskState === 'playing' && (
        <div className="h-full flex flex-col lg:flex-row">
          {/* Camera View */}
          <div className="w-full lg:w-[60%] h-[40%] sm:h-[45%] lg:h-full">
            <KioskCameraView showControls={true} />
          </div>

          {/* Controls */}
          <div className="w-full lg:w-[40%] h-[60%] sm:h-[55%] lg:h-full p-2 sm:p-3 lg:p-4 overflow-y-auto bg-[#0a0a0f]/50">
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              {/* Token Display */}
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-amber-400 font-medium text-sm sm:text-base">TOKENS</span>
                <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">{tokens}</span>
              </div>

              {/* Train Controls - side by side on small screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
                <KioskTrainControl
                  trainId={1}
                  trainName="Train 1"
                  color="#06b6d4"
                  onSpeedChange={(speed, dir) => {
                    resetIdle();
                    setTrain1Speed(speed);
                    setTrain1Dir(dir);
                    if (speed > 50) gameEngine?.addScore('speed_bonus', 'Speed Bonus', 'train1');
                  }}
                  onEmergencyStop={handleEmergencyStop}
                />

                <KioskTrainControl
                  trainId={2}
                  trainName="Train 2"
                  color="#a855f7"
                  onSpeedChange={(speed, dir) => {
                    resetIdle();
                    setTrain2Speed(speed);
                    setTrain2Dir(dir);
                    if (speed > 50) gameEngine?.addScore('speed_bonus', 'Speed Bonus', 'train2');
                  }}
                  onEmergencyStop={handleEmergencyStop}
                />
              </div>

              {/* Junction Controls */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <JunctionToggle
                  junctionId="j1"
                  junctionName="Jct 1"
                  currentState={junctions.j1}
                  onToggle={() => toggleJunction('j1')}
                  keyHint="1"
                />
                <JunctionToggle
                  junctionId="j2"
                  junctionName="Jct 2"
                  currentState={junctions.j2}
                  onToggle={() => toggleJunction('j2')}
                  keyHint="2"
                />
                <JunctionToggle
                  junctionId="j3"
                  junctionName="Jct 3"
                  currentState={junctions.j3}
                  onToggle={() => toggleJunction('j3')}
                  keyHint="3"
                />
              </div>

              {/* Emergency Stop */}
              <EmergencyStopButton onStop={handleEmergencyStop} />
            </div>
          </div>
        </div>
      )}

      {/* Game HUD Overlay */}
      {kioskState === 'playing' && gameState && (
        <GameHUD
          gameState={gameState}
          onPause={() => gameEngine?.pause()}
          onResume={() => gameEngine?.resume()}
          onEnd={() => {
            gameEngine?.end();
            setKioskState('game-over');
          }}
        />
      )}

      {/* Game Over Screen */}
      {kioskState === 'game-over' && gameState && (
        <GameOverScreen
          gameState={gameState}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}

      {/* Mode indicator */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 text-xs z-50">
        <span className={mode === 'demo' ? 'text-purple-400' : 'text-emerald-400'}>
          {mode === 'demo' ? 'DEMO MODE' : 'LIVE MODE'}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Attract Screen Component
// ============================================

interface AttractScreenProps {
  tokens: number;
  onStart: () => void;
}

function AttractScreen({ tokens, onStart }: AttractScreenProps) {
  const [showHighlights, setShowHighlights] = useState(true);

  // Cycle attract content
  useEffect(() => {
    const interval = setInterval(() => {
      setShowHighlights((prev) => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#12121c] to-[#0a0a0f] p-4">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 animate-gradient"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            RAILROAD
          </h1>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            ARCADE
          </h2>
        </div>

        {/* Token display */}
        {tokens > 0 && (
          <div className="mb-4 sm:mb-6 md:mb-8 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 inline-block">
            <span className="text-amber-400 text-lg sm:text-xl md:text-2xl font-bold font-mono">{tokens} TOKENS</span>
          </div>
        )}

        {/* Call to action */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <button
            onClick={onStart}
            className="px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-lg sm:text-xl md:text-2xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20 animate-bounce min-h-[56px]"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            PRESS START
          </button>
          <p className="mt-3 sm:mt-4 text-gray-500 text-xs sm:text-sm">or press ENTER</p>
        </div>

        {/* Features highlight */}
        <div className={`transition-opacity duration-500 ${showHighlights ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 max-w-2xl px-4">
            {['Multi-Level', 'Real-Time', 'Game Modes', 'Leaderboards'].map((feature) => (
              <span
                key={feature}
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs sm:text-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 text-center px-4">
        <p className="text-gray-600 text-xs sm:text-sm">
          Insert coins or play FREE in Demo Mode
        </p>
      </div>
    </div>
  );
}
