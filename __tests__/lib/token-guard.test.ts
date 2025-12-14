/**
 * Token Guard Unit Tests
 */

import {
  TokenGuard,
  formatActionCost,
  getActionDescription,
} from '@/lib/token-guard';
import { ACTION_PRICING } from '@/lib/pricing';

describe('TokenGuard', () => {
  describe('Demo Mode', () => {
    let guard: TokenGuard;

    beforeEach(() => {
      guard = new TokenGuard({ isLiveMode: false });
    });

    it('should allow all actions in demo mode', async () => {
      const result = await guard.canPerformAction('TRAIN_START');
      expect(result.allowed).toBe(true);
      expect(result.cost).toBe(0);
    });

    it('should execute actions without token deduction in demo mode', async () => {
      let executed = false;
      const result = await guard.executeAction('TRAIN_START', async () => {
        executed = true;
      });

      expect(result.success).toBe(true);
      expect(executed).toBe(true);
    });

    it('should return 0 cost for all actions in demo mode', () => {
      expect(guard.getActionCost('TRAIN_START')).toBe(0);
      expect(guard.getActionCost('JUNCTION_SWITCH')).toBe(0);
      expect(guard.getActionCost('CROSSING_TOGGLE')).toBe(0);
    });
  });

  describe('Live Mode', () => {
    let guard: TokenGuard;
    let onBalanceChange: jest.Mock;
    let onError: jest.Mock;

    beforeEach(() => {
      onBalanceChange = jest.fn();
      onError = jest.fn();
      guard = new TokenGuard({
        isLiveMode: true,
        onBalanceChange,
        onError,
      });
    });

    it('should return actual costs in live mode', () => {
      expect(guard.getActionCost('TRAIN_START')).toBe(ACTION_PRICING.TRAIN_START);
      expect(guard.getActionCost('JUNCTION_SWITCH')).toBe(ACTION_PRICING.JUNCTION_SWITCH);
    });

    it('should return 0 for free actions', () => {
      expect(guard.getActionCost('EMERGENCY_STOP')).toBe(0);
      expect(guard.getActionCost('TRAIN_STOP')).toBe(0);
    });

    it('should return 0 for unknown actions', () => {
      expect(guard.getActionCost('UNKNOWN_ACTION')).toBe(0);
    });
  });

  describe('Mode Switching', () => {
    it('should switch from demo to live mode', () => {
      const guard = new TokenGuard({ isLiveMode: false });

      expect(guard.getActionCost('TRAIN_START')).toBe(0);

      guard.setLiveMode(true);

      expect(guard.getActionCost('TRAIN_START')).toBe(ACTION_PRICING.TRAIN_START);
    });

    it('should switch from live to demo mode', () => {
      const guard = new TokenGuard({ isLiveMode: true });

      expect(guard.getActionCost('TRAIN_START')).toBe(ACTION_PRICING.TRAIN_START);

      guard.setLiveMode(false);

      expect(guard.getActionCost('TRAIN_START')).toBe(0);
    });
  });

  describe('Action Execution', () => {
    it('should catch and report errors', async () => {
      const onError = jest.fn();
      const guard = new TokenGuard({ isLiveMode: false, onError });

      const result = await guard.executeAction('TEST', async () => {
        throw new Error('Test error');
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(onError).toHaveBeenCalledWith('Test error');
    });

    it('should return result on success', async () => {
      const guard = new TokenGuard({ isLiveMode: false });

      const result = await guard.executeAction('TEST', async () => {
        return 'success value';
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('success value');
    });
  });
});

describe('formatActionCost', () => {
  it('should return "Free" for demo mode', () => {
    expect(formatActionCost('TRAIN_START', false)).toBe('Free');
    expect(formatActionCost('JUNCTION_SWITCH', false)).toBe('Free');
  });

  it('should return "Free" for free actions in live mode', () => {
    expect(formatActionCost('EMERGENCY_STOP', true)).toBe('Free');
    expect(formatActionCost('TRAIN_STOP', true)).toBe('Free');
  });

  it('should return token count for paid actions in live mode', () => {
    const trainStartCost = ACTION_PRICING.TRAIN_START;
    expect(formatActionCost('TRAIN_START', true)).toBe(`${trainStartCost} token${trainStartCost !== 1 ? 's' : ''}`);
  });

  it('should handle singular token correctly', () => {
    // CROSSING_TOGGLE costs 1 token
    const crossingCost = ACTION_PRICING.CROSSING_TOGGLE;
    if (crossingCost === 1) {
      expect(formatActionCost('CROSSING_TOGGLE', true)).toBe('1 token');
    }
  });
});

describe('getActionDescription', () => {
  it('should return descriptions for known actions', () => {
    expect(getActionDescription('TRAIN_START')).toBe('Start train');
    expect(getActionDescription('TRAIN_STOP')).toBe('Stop train');
    expect(getActionDescription('JUNCTION_SWITCH')).toBe('Switch junction');
    expect(getActionDescription('CROSSING_TOGGLE')).toBe('Toggle crossing gate');
    expect(getActionDescription('EMERGENCY_STOP')).toBe('Emergency stop all trains');
  });

  it('should return action name for unknown actions', () => {
    expect(getActionDescription('UNKNOWN_ACTION')).toBe('UNKNOWN_ACTION');
  });
});
