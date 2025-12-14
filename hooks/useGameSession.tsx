'use client';

// ============================================
// Game Session Hook
// ============================================
// Manages game session lifecycle, scoring, and
// integration with the GameModeEngine.

import { useState, useCallback, useRef, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  GameModeEngine,
  GameState,
  GameModeId,
  GAME_MODE_CONFIGS,
  createGameMode,
  ScoringEvent,
} from '@/lib/game-modes/GameModeEngine';
import { useGameMode } from '@/lib/contexts/ModeContext';
import { useSounds } from '@/hooks/useSounds';

// ============================================
// Types
// ============================================

export interface GameSessionContext {
  // State
  gameState: GameState | null;
  isGameActive: boolean;
  isPaused: boolean;
  currentMode: GameModeId | null;
  sessionId: string | null;

  // Actions
  startGame: (modeId: GameModeId) => Promise<boolean>;
  endGame: () => Promise<void>;
  pauseGame: () => void;
  resumeGame: () => void;

  // Scoring
  addScore: (event: string, description: string, trainId?: string) => void;
  updateObjective: (objectiveId: string, progress: number) => void;

  // Events
  onTrainUpdate: (train: { id: string; speed: number }) => void;
  onLapComplete: (trainId: string) => void;
  onJunctionSwitch: (junctionId: string, junctionName: string) => void;
  onCrossingActivate: (crossingId: string) => void;
  onNearMiss: (train1Id: string, train2Id: string) => void;
  onCollision: (train1Id: string, train2Id: string) => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useGameSession(): GameSessionContext {
  const { mode } = useGameMode();
  const { play: playSound } = useSounds();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<GameModeId | null>(null);

  const engineRef = useRef<GameModeEngine | null>(null);

  // Derived state
  const isGameActive = gameState?.isActive ?? false;
  const isPaused = gameState?.isPaused ?? false;

  // ============================================
  // Start Game
  // ============================================

  const startGame = useCallback(
    async (modeId: GameModeId): Promise<boolean> => {
      try {
        const config = GAME_MODE_CONFIGS[modeId];
        if (!config) {
          console.error('Unknown game mode:', modeId);
          return false;
        }

        // Check if mode requires tokens (live mode only)
        if (mode === 'live' && config.tokenCost > 0) {
          // Create game session in database
          const response = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameMode: modeId,
              isLive: mode === 'live',
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to start game session:', error);
            return false;
          }

          const data = await response.json();
          if (data.success) {
            setSessionId(data.data.sessionId);
          }
        } else {
          // Demo mode - generate local session ID
          setSessionId(`demo-${Date.now()}`);
        }

        // Clean up previous engine
        if (engineRef.current) {
          engineRef.current.destroy();
        }

        // Create new game engine
        const engine = createGameMode(modeId);

        // Set up callbacks
        engine.setOnStateChange((state) => {
          setGameState(state);

          // Play sounds for scoring events
          if (state.recentEvents.length > 0) {
            const latestEvent = state.recentEvents[0];
            if (latestEvent.timestamp > Date.now() - 500) {
              playSound('score');
            }
          }
        });

        engine.setOnGameEnd(async (finalState) => {
          // Submit score to leaderboard
          if (finalState.score > 0) {
            try {
              await fetch('/api/leaderboards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  gameMode: modeId,
                  score: finalState.score,
                  isLive: mode === 'live',
                }),
              });
            } catch (err) {
              console.error('Failed to submit score:', err);
            }
          }

          // End game session in database
          if (sessionId && mode === 'live') {
            try {
              await fetch('/api/games', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId,
                  score: finalState.score,
                  metadata: finalState.stats,
                }),
              });
            } catch (err) {
              console.error('Failed to end game session:', err);
            }
          }

          playSound('game_over');
        });

        engineRef.current = engine;
        setCurrentMode(modeId);

        // Start the game
        engine.start();
        playSound('game_start');

        return true;
      } catch (error) {
        console.error('Error starting game:', error);
        return false;
      }
    },
    [mode, playSound, sessionId]
  );

  // ============================================
  // End Game
  // ============================================

  const endGame = useCallback(async () => {
    if (engineRef.current) {
      engineRef.current.end();
    }
  }, []);

  // ============================================
  // Pause / Resume
  // ============================================

  const pauseGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
  }, []);

  // ============================================
  // Scoring Methods
  // ============================================

  const addScore = useCallback(
    (event: string, description: string, trainId?: string) => {
      if (engineRef.current) {
        engineRef.current.addScore(event, description, trainId);
      }
    },
    []
  );

  const updateObjective = useCallback(
    (objectiveId: string, progress: number) => {
      if (engineRef.current) {
        engineRef.current.updateObjective(objectiveId, progress);
      }
    },
    []
  );

  // ============================================
  // Event Handlers
  // ============================================

  const onTrainUpdate = useCallback(
    (train: { id: string; speed: number }) => {
      if (engineRef.current) {
        engineRef.current.onTrainUpdate({
          trackId: parseInt(train.id) || 0,
          name: `Train ${train.id}`,
          speed: train.speed,
          direction: 'forward',
          position: 0,
          level: 1,
          headlights: true,
          carts: 3,
          color: '#00f0ff',
        });
      }
    },
    []
  );

  const onLapComplete = useCallback(
    (trainId: string) => {
      if (engineRef.current) {
        engineRef.current.onLapComplete(trainId);
        playSound('achievement');
      }
    },
    [playSound]
  );

  const onJunctionSwitch = useCallback(
    (junctionId: string, junctionName: string) => {
      if (engineRef.current) {
        engineRef.current.onJunctionSwitch({
          id: junctionId,
          name: junctionName,
          level: 1,
          position: 'straight',
        });
      }
    },
    []
  );

  const onCrossingActivate = useCallback(
    (crossingId: string) => {
      if (engineRef.current) {
        engineRef.current.onCrossingActivate({
          id: crossingId,
          name: 'Crossing',
          level: 1,
          isOpen: true,
          gatePosition: 'down',
        });
      }
    },
    []
  );

  const onNearMiss = useCallback(
    (train1Id: string, train2Id: string) => {
      if (engineRef.current) {
        engineRef.current.onNearMiss(train1Id, train2Id);
        playSound('warning');
      }
    },
    [playSound]
  );

  const onCollision = useCallback(
    (train1Id: string, train2Id: string) => {
      if (engineRef.current) {
        engineRef.current.onCollision(train1Id, train2Id);
        playSound('error');

        // In Survival mode, collision ends the game
        if (currentMode === 'SURVIVAL') {
          engineRef.current.end();
        }
      }
    },
    [playSound, currentMode]
  );

  // ============================================
  // Cleanup
  // ============================================

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  return {
    // State
    gameState,
    isGameActive,
    isPaused,
    currentMode,
    sessionId,

    // Actions
    startGame,
    endGame,
    pauseGame,
    resumeGame,

    // Scoring
    addScore,
    updateObjective,

    // Events
    onTrainUpdate,
    onLapComplete,
    onJunctionSwitch,
    onCrossingActivate,
    onNearMiss,
    onCollision,
  };
}

// ============================================
// Context for sharing game session
// ============================================

const GameSessionContext = createContext<GameSessionContext | null>(null);

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const session = useGameSession();

  return (
    <GameSessionContext.Provider value={session}>
      {children}
    </GameSessionContext.Provider>
  );
}

export function useGameSessionContext(): GameSessionContext {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error(
      'useGameSessionContext must be used within a GameSessionProvider'
    );
  }
  return context;
}
