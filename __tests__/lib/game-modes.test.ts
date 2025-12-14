/**
 * Game Mode Engine Unit Tests
 */

import {
  GameModeEngine,
  createGameMode,
  GAME_MODE_CONFIGS,
  GameModeId,
  GameState,
} from '@/lib/game-modes/GameModeEngine';

describe('GameModeEngine', () => {
  let engine: GameModeEngine;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (engine) {
      engine.destroy();
    }
    jest.useRealTimers();
  });

  describe('createGameMode factory', () => {
    it('should create FREE_PLAY mode', () => {
      engine = createGameMode('FREE_PLAY');
      const state = engine.getState();

      expect(state.mode).toBe('FREE_PLAY');
      expect(state.isActive).toBe(false);
      expect(state.score).toBe(0);
    });

    it('should create SPEED_RUN mode with duration', () => {
      engine = createGameMode('SPEED_RUN');
      const config = engine.getConfig();

      expect(config.id).toBe('SPEED_RUN');
      expect(config.duration).toBe(300);
      expect(config.objectives.length).toBeGreaterThan(0);
    });

    it('should throw for unknown mode', () => {
      expect(() => createGameMode('INVALID' as GameModeId)).toThrow('Unknown game mode');
    });
  });

  describe('Game Lifecycle', () => {
    beforeEach(() => {
      engine = createGameMode('FREE_PLAY');
    });

    it('should start the game', () => {
      engine.start();
      const state = engine.getState();

      expect(state.isActive).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.startTime).toBeGreaterThan(0);
    });

    it('should pause and resume the game', () => {
      engine.start();

      engine.pause();
      expect(engine.getState().isPaused).toBe(true);

      engine.resume();
      expect(engine.getState().isPaused).toBe(false);
    });

    it('should end the game', () => {
      engine.start();
      engine.end();

      expect(engine.getState().isActive).toBe(false);
    });

    it('should call onGameEnd callback when game ends', () => {
      const onGameEnd = jest.fn();
      engine.setOnGameEnd(onGameEnd);

      engine.start();
      engine.end();

      expect(onGameEnd).toHaveBeenCalled();
    });

    it('should call onStateChange callback when state changes', () => {
      const onStateChange = jest.fn();
      engine.setOnStateChange(onStateChange);

      engine.start();

      expect(onStateChange).toHaveBeenCalled();
    });
  });

  describe('Scoring', () => {
    beforeEach(() => {
      engine = createGameMode('FREE_PLAY');
      engine.start();
    });

    it('should add score for valid events', () => {
      engine.addScore('LAP_COMPLETE', 'Lap completed!', 'train1');

      expect(engine.getState().score).toBeGreaterThan(0);
      expect(engine.getState().recentEvents.length).toBe(1);
    });

    it('should not add score for unknown events', () => {
      engine.addScore('UNKNOWN_EVENT', 'Unknown');

      expect(engine.getState().score).toBe(0);
    });

    it('should apply multiplier to multiplier-enabled events', () => {
      engine.setMultiplier(2);
      engine.addScore('LAP_COMPLETE', 'Lap completed!');

      const state = engine.getState();
      expect(state.recentEvents[0].multiplier).toBe(2);
    });

    it('should limit recent events to 10', () => {
      for (let i = 0; i < 15; i++) {
        engine.addScore('LAP_COMPLETE', `Lap ${i}`);
      }

      expect(engine.getState().recentEvents.length).toBe(10);
    });
  });

  describe('Multiplier', () => {
    beforeEach(() => {
      engine = createGameMode('FREE_PLAY');
      engine.start();
    });

    it('should set multiplier within bounds', () => {
      engine.setMultiplier(5);
      expect(engine.getState().multiplier).toBe(5);

      engine.setMultiplier(15); // Above max
      expect(engine.getState().multiplier).toBe(10);

      engine.setMultiplier(0); // Below min
      expect(engine.getState().multiplier).toBe(1);
    });

    it('should increment multiplier', () => {
      engine.incrementMultiplier();
      expect(engine.getState().multiplier).toBe(1.5);

      engine.incrementMultiplier();
      expect(engine.getState().multiplier).toBe(2);
    });

    it('should reset multiplier', () => {
      engine.setMultiplier(5);
      engine.resetMultiplier();
      expect(engine.getState().multiplier).toBe(1);
    });
  });

  describe('Objectives', () => {
    beforeEach(() => {
      engine = createGameMode('SPEED_RUN'); // Has objectives
      engine.start();
    });

    it('should update objective progress', () => {
      engine.updateObjective('laps', 1);

      const objective = engine.getState().objectives.find(o => o.id === 'laps');
      expect(objective?.current).toBe(1);
    });

    it('should mark objective as completed when target reached', () => {
      for (let i = 0; i < 5; i++) {
        engine.updateObjective('laps', 1);
      }

      const objective = engine.getState().objectives.find(o => o.id === 'laps');
      expect(objective?.completed).toBe(true);
    });
  });

  describe('Stats', () => {
    beforeEach(() => {
      engine = createGameMode('FREE_PLAY');
      engine.start();
    });

    it('should update stats', () => {
      engine.updateStats({ lapsCompleted: 5, topSpeed: 100 });

      const stats = engine.getState().stats;
      expect(stats.lapsCompleted).toBe(5);
      expect(stats.topSpeed).toBe(100);
    });

    it('should track top speed on train update', () => {
      const baseTrain = { trackId: 1, name: 'Train 1', direction: 'forward' as const, position: 0, level: 1, headlights: true, carts: 2, color: '#FF0000' };

      engine.onTrainUpdate({ ...baseTrain, speed: 50 });
      expect(engine.getState().stats.topSpeed).toBe(50);

      engine.onTrainUpdate({ ...baseTrain, speed: 75 });
      expect(engine.getState().stats.topSpeed).toBe(75);

      engine.onTrainUpdate({ ...baseTrain, speed: 25 });
      expect(engine.getState().stats.topSpeed).toBe(75); // Should not decrease
    });

    it('should increment laps and multiplier on lap complete', () => {
      const initialMultiplier = engine.getState().multiplier;

      engine.onLapComplete('train1');

      expect(engine.getState().stats.lapsCompleted).toBe(1);
      expect(engine.getState().multiplier).toBeGreaterThan(initialMultiplier);
    });

    it('should track near misses', () => {
      engine.onNearMiss('train1', 'train2');

      expect(engine.getState().stats.nearMisses).toBe(1);
    });

    it('should reset multiplier on collision', () => {
      engine.setMultiplier(5);
      engine.onCollision('train1', 'train2');

      expect(engine.getState().multiplier).toBe(1);
    });
  });

  describe('Timed Modes', () => {
    it('should end game when time runs out', () => {
      engine = createGameMode('TIME_ATTACK'); // 3 minute duration
      engine.start();

      // Fast forward past duration
      jest.advanceTimersByTime(180 * 1000 + 1000);

      expect(engine.getState().isActive).toBe(false);
    });

    it('should track remaining time', () => {
      engine = createGameMode('TIME_ATTACK');
      engine.start();

      jest.advanceTimersByTime(60 * 1000);

      expect(engine.getState().remainingTime).toBe(120); // 2 minutes left
    });
  });
});

describe('GAME_MODE_CONFIGS', () => {
  it('should have all required modes', () => {
    expect(GAME_MODE_CONFIGS).toHaveProperty('FREE_PLAY');
    expect(GAME_MODE_CONFIGS).toHaveProperty('SPEED_RUN');
    expect(GAME_MODE_CONFIGS).toHaveProperty('DELIVERY_MISSION');
    expect(GAME_MODE_CONFIGS).toHaveProperty('SURVIVAL');
    expect(GAME_MODE_CONFIGS).toHaveProperty('TIME_ATTACK');
  });

  it('should have valid token costs', () => {
    Object.values(GAME_MODE_CONFIGS).forEach(config => {
      expect(config.tokenCost).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have FREE_PLAY available in both modes', () => {
    expect(GAME_MODE_CONFIGS.FREE_PLAY.availableInDemo).toBe(true);
    expect(GAME_MODE_CONFIGS.FREE_PLAY.availableInLive).toBe(true);
    expect(GAME_MODE_CONFIGS.FREE_PLAY.tokenCost).toBe(0);
  });
});
