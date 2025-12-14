// ============================================
// Game Mode Engine
// ============================================
// Base engine for all game modes with scoring,
// objectives, and event tracking.

import { TrainState, JunctionState, CrossingState } from '../hardware/HardwareAdapter';

// ============================================
// Types
// ============================================

export type GameModeId = 'FREE_PLAY' | 'SPEED_RUN' | 'DELIVERY_MISSION' | 'SURVIVAL' | 'TIME_ATTACK';

export interface GameModeConfig {
  id: GameModeId;
  name: string;
  description: string;
  duration: number | null; // seconds, null = unlimited
  objectives: Objective[];
  scoringRules: ScoringRule[];
  availableInDemo: boolean;
  availableInLive: boolean;
  tokenCost: number;
}

export interface Objective {
  id: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  points: number;
}

export interface ScoringRule {
  event: string;
  points: number;
  multiplierEnabled: boolean;
}

export interface ScoringEvent {
  type: string;
  trainId?: string;
  points: number;
  multiplier: number;
  timestamp: number;
  description: string;
}

export interface GameState {
  mode: GameModeId;
  isActive: boolean;
  isPaused: boolean;
  startTime: number;
  elapsedTime: number;
  remainingTime: number | null;
  score: number;
  multiplier: number;
  objectives: Objective[];
  recentEvents: ScoringEvent[];
  stats: GameStats;
}

export interface GameStats {
  lapsCompleted: number;
  totalDistance: number;
  topSpeed: number;
  nearMisses: number;
  perfectSwitches: number;
  deliveriesCompleted: number;
}

// ============================================
// Game Mode Engine
// ============================================

export class GameModeEngine {
  protected config: GameModeConfig;
  protected state: GameState;
  protected onStateChange?: (state: GameState) => void;
  protected onGameEnd?: (finalState: GameState) => void;
  private timerInterval: NodeJS.Timeout | null = null;

  constructor(config: GameModeConfig) {
    this.config = config;
    this.state = this.createInitialState();
  }

  protected createInitialState(): GameState {
    return {
      mode: this.config.id,
      isActive: false,
      isPaused: false,
      startTime: 0,
      elapsedTime: 0,
      remainingTime: this.config.duration,
      score: 0,
      multiplier: 1,
      objectives: this.config.objectives.map((obj) => ({ ...obj })),
      recentEvents: [],
      stats: {
        lapsCompleted: 0,
        totalDistance: 0,
        topSpeed: 0,
        nearMisses: 0,
        perfectSwitches: 0,
        deliveriesCompleted: 0,
      },
    };
  }

  // ============================================
  // Lifecycle
  // ============================================

  start(): void {
    this.state = this.createInitialState();
    this.state.isActive = true;
    this.state.startTime = Date.now();

    if (this.config.duration) {
      this.startTimer();
    }

    this.notifyStateChange();
  }

  pause(): void {
    if (!this.state.isActive) return;
    this.state.isPaused = true;
    this.stopTimer();
    this.notifyStateChange();
  }

  resume(): void {
    if (!this.state.isActive || !this.state.isPaused) return;
    this.state.isPaused = false;
    if (this.config.duration) {
      this.startTimer();
    }
    this.notifyStateChange();
  }

  end(): void {
    this.state.isActive = false;
    this.stopTimer();
    this.onGameEnd?.(this.state);
    this.notifyStateChange();
  }

  // ============================================
  // Timer
  // ============================================

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.state.isPaused) return;

      this.state.elapsedTime = Math.floor((Date.now() - this.state.startTime) / 1000);

      if (this.config.duration) {
        this.state.remainingTime = Math.max(0, this.config.duration - this.state.elapsedTime);

        if (this.state.remainingTime === 0) {
          this.end();
        }
      }

      this.notifyStateChange();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ============================================
  // Scoring
  // ============================================

  addScore(event: string, description: string, trainId?: string): void {
    const rule = this.config.scoringRules.find((r) => r.event === event);
    if (!rule) return;

    const multiplier = rule.multiplierEnabled ? this.state.multiplier : 1;
    const points = rule.points * multiplier;

    this.state.score += points;

    const scoringEvent: ScoringEvent = {
      type: event,
      trainId,
      points,
      multiplier,
      timestamp: Date.now(),
      description,
    };

    this.state.recentEvents.unshift(scoringEvent);
    if (this.state.recentEvents.length > 10) {
      this.state.recentEvents.pop();
    }

    this.notifyStateChange();
  }

  setMultiplier(multiplier: number): void {
    this.state.multiplier = Math.max(1, Math.min(10, multiplier));
    this.notifyStateChange();
  }

  incrementMultiplier(): void {
    this.setMultiplier(this.state.multiplier + 0.5);
  }

  resetMultiplier(): void {
    this.setMultiplier(1);
  }

  // ============================================
  // Objectives
  // ============================================

  updateObjective(objectiveId: string, progress: number): void {
    const objective = this.state.objectives.find((o) => o.id === objectiveId);
    if (!objective) return;

    objective.current = Math.min(objective.target, objective.current + progress);
    objective.completed = objective.current >= objective.target;

    if (objective.completed) {
      this.addScore('OBJECTIVE_COMPLETE', `Completed: ${objective.description}`);
      this.state.score += objective.points;
    }

    // Check if all objectives complete
    if (this.state.objectives.every((o) => o.completed)) {
      this.addScore('ALL_OBJECTIVES', 'All objectives completed!');
      this.end();
    }

    this.notifyStateChange();
  }

  // ============================================
  // Stats
  // ============================================

  updateStats(updates: Partial<GameStats>): void {
    this.state.stats = { ...this.state.stats, ...updates };
    this.notifyStateChange();
  }

  // ============================================
  // Event Handlers (to be overridden by specific modes)
  // ============================================

  onTrainUpdate(train: TrainState): void {
    // Track top speed
    if (train.speed > this.state.stats.topSpeed) {
      this.updateStats({ topSpeed: train.speed });
    }
  }

  onLapComplete(trainId: string): void {
    this.updateStats({ lapsCompleted: this.state.stats.lapsCompleted + 1 });
    this.addScore('LAP_COMPLETE', 'Lap completed!', trainId);
    this.incrementMultiplier();
  }

  onJunctionSwitch(junction: JunctionState): void {
    this.addScore('JUNCTION_SWITCH', `Switched ${junction.name}`);
  }

  onCrossingActivate(crossing: CrossingState): void {
    // Optional override
  }

  onNearMiss(train1Id: string, train2Id: string): void {
    this.updateStats({ nearMisses: this.state.stats.nearMisses + 1 });
    this.addScore('NEAR_MISS', 'Near miss!');
    this.incrementMultiplier();
  }

  onCollision(train1Id: string, train2Id: string): void {
    this.resetMultiplier();
    // Specific modes may end game on collision
  }

  // ============================================
  // State Access
  // ============================================

  getState(): GameState {
    return { ...this.state };
  }

  getConfig(): GameModeConfig {
    return { ...this.config };
  }

  // ============================================
  // Callbacks
  // ============================================

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  setOnGameEnd(callback: (finalState: GameState) => void): void {
    this.onGameEnd = callback;
  }

  protected notifyStateChange(): void {
    this.onStateChange?.({ ...this.state });
  }

  // ============================================
  // Cleanup
  // ============================================

  destroy(): void {
    this.stopTimer();
    this.onStateChange = undefined;
    this.onGameEnd = undefined;
  }
}

// ============================================
// Game Mode Configs
// ============================================

export const GAME_MODE_CONFIGS: Record<GameModeId, GameModeConfig> = {
  FREE_PLAY: {
    id: 'FREE_PLAY',
    name: 'Free Play',
    description: 'Sandbox mode with no objectives or time limit. Just have fun!',
    duration: null,
    objectives: [],
    scoringRules: [
      { event: 'LAP_COMPLETE', points: 100, multiplierEnabled: true },
      { event: 'JUNCTION_SWITCH', points: 10, multiplierEnabled: false },
      { event: 'NEAR_MISS', points: 50, multiplierEnabled: true },
    ],
    availableInDemo: true,
    availableInLive: true,
    tokenCost: 0,
  },
  SPEED_RUN: {
    id: 'SPEED_RUN',
    name: 'Speed Run',
    description: 'Complete 5 laps as fast as possible!',
    duration: 300, // 5 minutes max
    objectives: [
      { id: 'laps', description: 'Complete 5 laps', target: 5, current: 0, completed: false, points: 500 },
    ],
    scoringRules: [
      { event: 'LAP_COMPLETE', points: 200, multiplierEnabled: true },
      { event: 'FAST_LAP', points: 300, multiplierEnabled: true },
      { event: 'NEAR_MISS', points: 100, multiplierEnabled: true },
    ],
    availableInDemo: true,
    availableInLive: true,
    tokenCost: 5,
  },
  DELIVERY_MISSION: {
    id: 'DELIVERY_MISSION',
    name: 'Delivery Mission',
    description: 'Transport cargo between stations within the time limit.',
    duration: 480, // 8 minutes
    objectives: [
      { id: 'deliveries', description: 'Complete 3 deliveries', target: 3, current: 0, completed: false, points: 300 },
    ],
    scoringRules: [
      { event: 'DELIVERY_COMPLETE', points: 400, multiplierEnabled: true },
      { event: 'ON_TIME_BONUS', points: 200, multiplierEnabled: true },
      { event: 'CAREFUL_HANDLING', points: 100, multiplierEnabled: false },
    ],
    availableInDemo: true,
    availableInLive: true,
    tokenCost: 8,
  },
  SURVIVAL: {
    id: 'SURVIVAL',
    name: 'Survival',
    description: 'Run all trains without any collisions. How long can you last?',
    duration: null, // Endless until collision
    objectives: [],
    scoringRules: [
      { event: 'SURVIVAL_TICK', points: 1, multiplierEnabled: true }, // Points per second
      { event: 'NEAR_MISS', points: 200, multiplierEnabled: true },
      { event: 'LAP_COMPLETE', points: 150, multiplierEnabled: true },
    ],
    availableInDemo: true,
    availableInLive: true,
    tokenCost: 10,
  },
  TIME_ATTACK: {
    id: 'TIME_ATTACK',
    name: 'Time Attack',
    description: 'Complete as many laps as possible in 3 minutes!',
    duration: 180, // 3 minutes
    objectives: [],
    scoringRules: [
      { event: 'LAP_COMPLETE', points: 150, multiplierEnabled: true },
      { event: 'JUNCTION_SWITCH', points: 20, multiplierEnabled: false },
      { event: 'SPEED_BONUS', points: 50, multiplierEnabled: true },
    ],
    availableInDemo: true,
    availableInLive: true,
    tokenCost: 8,
  },
};

// ============================================
// Factory
// ============================================

export function createGameMode(modeId: GameModeId): GameModeEngine {
  const config = GAME_MODE_CONFIGS[modeId];
  if (!config) {
    throw new Error(`Unknown game mode: ${modeId}`);
  }
  return new GameModeEngine(config);
}
