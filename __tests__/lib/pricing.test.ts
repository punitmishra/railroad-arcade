/**
 * Pricing Configuration Unit Tests
 */

import {
  QUEUE_TIME_PACKAGES,
  EXTEND_TIME_PACKAGES,
  ACTION_PRICING,
  ACTION_DESCRIPTIONS,
  GAME_MODE_PRICING,
  MODULE_COSTS,
  TOKEN_PACKAGES,
  CRYPTO_PACKAGES,
  DEFAULT_UNLOCKED_MODULES,
  WELCOME_BONUS_TOKENS,
  getTimePricingById,
  getActionCost,
  getGameModeCost,
  calculateSessionCost,
  getTokenPackageById,
  getTotalTokens,
  formatPrice,
  getModuleCost,
  isModuleFree,
} from '@/lib/pricing';

describe('Pricing Configuration', () => {
  describe('QUEUE_TIME_PACKAGES', () => {
    it('should have at least 3 packages', () => {
      expect(QUEUE_TIME_PACKAGES.length).toBeGreaterThanOrEqual(3);
    });

    it('should have unique package IDs', () => {
      const ids = QUEUE_TIME_PACKAGES.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have exactly one popular package', () => {
      const popular = QUEUE_TIME_PACKAGES.filter(p => p.popular);
      expect(popular.length).toBe(1);
    });

    it('should have increasing token costs with duration', () => {
      const sorted = [...QUEUE_TIME_PACKAGES].sort((a, b) => a.duration - b.duration);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].tokens).toBeGreaterThanOrEqual(sorted[i - 1].tokens);
      }
    });

    it('should have valid durations', () => {
      QUEUE_TIME_PACKAGES.forEach(pkg => {
        expect(pkg.duration).toBeGreaterThan(0);
        expect(pkg.duration).toBeLessThanOrEqual(1800); // Max 30 minutes
      });
    });
  });

  describe('EXTEND_TIME_PACKAGES', () => {
    it('should have extension packages', () => {
      expect(EXTEND_TIME_PACKAGES.length).toBeGreaterThan(0);
    });

    it('should have unique IDs', () => {
      const ids = EXTEND_TIME_PACKAGES.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('ACTION_PRICING', () => {
    it('should have train start cost', () => {
      expect(ACTION_PRICING.TRAIN_START).toBeDefined();
      expect(ACTION_PRICING.TRAIN_START).toBeGreaterThan(0);
    });

    it('should have train stop as free', () => {
      expect(ACTION_PRICING.TRAIN_STOP).toBe(0);
    });

    it('should have emergency stop as free', () => {
      expect(ACTION_PRICING.EMERGENCY_STOP).toBe(0);
    });

    it('should have junction and crossing costs', () => {
      expect(ACTION_PRICING.JUNCTION_SWITCH).toBeGreaterThanOrEqual(0);
      expect(ACTION_PRICING.CROSSING_TOGGLE).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ACTION_DESCRIPTIONS', () => {
    it('should have descriptions for actions', () => {
      expect(ACTION_DESCRIPTIONS.length).toBeGreaterThan(0);
    });

    it('should have required properties', () => {
      ACTION_DESCRIPTIONS.forEach(desc => {
        expect(desc).toHaveProperty('action');
        expect(desc).toHaveProperty('name');
        expect(desc).toHaveProperty('tokens');
        expect(desc).toHaveProperty('description');
      });
    });
  });

  describe('GAME_MODE_PRICING', () => {
    it('should have pricing for all game modes', () => {
      expect(GAME_MODE_PRICING.length).toBeGreaterThan(0);
    });

    it('should have FREE_PLAY as free', () => {
      const freePlay = GAME_MODE_PRICING.find(p => p.mode === 'FREE_PLAY');
      expect(freePlay).toBeDefined();
      expect(freePlay?.tokens).toBe(0);
    });
  });

  describe('MODULE_COSTS', () => {
    it('should have costs for modules', () => {
      expect(MODULE_COSTS.trains).toBeDefined();
      expect(MODULE_COSTS.police).toBeDefined();
      expect(MODULE_COSTS.fire).toBeDefined();
    });

    it('should have non-negative costs', () => {
      Object.values(MODULE_COSTS).forEach(cost => {
        expect(cost).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have trains as free', () => {
      expect(MODULE_COSTS.trains).toBe(0);
    });
  });

  describe('DEFAULT_UNLOCKED_MODULES', () => {
    it('should include trains and scenery', () => {
      expect(DEFAULT_UNLOCKED_MODULES).toContain('trains');
      expect(DEFAULT_UNLOCKED_MODULES).toContain('scenery');
    });
  });

  describe('TOKEN_PACKAGES', () => {
    it('should have at least 3 packages', () => {
      expect(TOKEN_PACKAGES.length).toBeGreaterThanOrEqual(3);
    });

    it('should have unique package IDs', () => {
      const ids = TOKEN_PACKAGES.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have exactly one popular package', () => {
      const popular = TOKEN_PACKAGES.filter(p => p.popular);
      expect(popular.length).toBe(1);
    });

    it('should have valid prices in cents', () => {
      TOKEN_PACKAGES.forEach(pkg => {
        expect(pkg.price).toBeGreaterThan(0);
        expect(Number.isInteger(pkg.price)).toBe(true);
      });
    });

    it('should have bonus tokens for larger packages', () => {
      const sortedByPrice = [...TOKEN_PACKAGES].sort((a, b) => a.price - b.price);
      const lastPkg = sortedByPrice[sortedByPrice.length - 1];
      expect(lastPkg.bonus).toBeGreaterThan(0);
    });
  });

  describe('CRYPTO_PACKAGES', () => {
    it('should have crypto-specific packages', () => {
      expect(CRYPTO_PACKAGES.length).toBeGreaterThan(0);
    });

    it('should have unique IDs different from regular packages', () => {
      const regularIds = TOKEN_PACKAGES.map(p => p.id);
      CRYPTO_PACKAGES.forEach(pkg => {
        expect(regularIds).not.toContain(pkg.id);
      });
    });
  });

  describe('getTimePricingById', () => {
    it('should return package for valid ID', () => {
      const pkg = getTimePricingById('standard');
      expect(pkg).toBeDefined();
      expect(pkg?.id).toBe('standard');
    });

    it('should return extend package', () => {
      const pkg = getTimePricingById('extend_5');
      expect(pkg).toBeDefined();
      expect(pkg?.id).toBe('extend_5');
    });

    it('should return undefined for invalid ID', () => {
      const pkg = getTimePricingById('invalid');
      expect(pkg).toBeUndefined();
    });
  });

  describe('getActionCost', () => {
    it('should return correct cost for known actions', () => {
      expect(getActionCost('TRAIN_START')).toBe(ACTION_PRICING.TRAIN_START);
      expect(getActionCost('TRAIN_STOP')).toBe(0);
    });

    it('should return 0 for unknown actions', () => {
      expect(getActionCost('UNKNOWN_ACTION')).toBe(0);
    });
  });

  describe('getGameModeCost', () => {
    it('should return correct cost for game modes', () => {
      expect(getGameModeCost('FREE_PLAY')).toBe(0);
      expect(getGameModeCost('SPEED_RUN')).toBeGreaterThan(0);
    });

    it('should return 0 for unknown modes', () => {
      expect(getGameModeCost('UNKNOWN_MODE')).toBe(0);
    });
  });

  describe('calculateSessionCost', () => {
    it('should calculate time and action costs', () => {
      const result = calculateSessionCost(5, ['TRAIN_START', 'JUNCTION_SWITCH']);

      expect(result).toHaveProperty('timeCost');
      expect(result).toHaveProperty('actionCost');
      expect(result).toHaveProperty('total');
      expect(result.total).toBe(result.timeCost + result.actionCost);
    });

    it('should handle empty actions', () => {
      const result = calculateSessionCost(5, []);
      expect(result.actionCost).toBe(0);
    });
  });

  describe('getTokenPackageById', () => {
    it('should return regular package', () => {
      const pkg = getTokenPackageById('starter');
      expect(pkg).toBeDefined();
      expect(pkg?.id).toBe('starter');
    });

    it('should return crypto package', () => {
      const pkg = getTokenPackageById('crypto-starter');
      expect(pkg).toBeDefined();
      expect(pkg?.id).toBe('crypto-starter');
    });

    it('should return undefined for invalid ID', () => {
      const pkg = getTokenPackageById('invalid');
      expect(pkg).toBeUndefined();
    });
  });

  describe('getTotalTokens', () => {
    it('should add tokens and bonus', () => {
      const pkg = { id: 'test', name: 'Test', tokens: 100, bonus: 20, price: 199 };
      expect(getTotalTokens(pkg)).toBe(120);
    });
  });

  describe('formatPrice', () => {
    it('should format cents to dollars', () => {
      expect(formatPrice(99)).toBe('$0.99');
      expect(formatPrice(199)).toBe('$1.99');
      expect(formatPrice(1000)).toBe('$10.00');
    });
  });

  describe('getModuleCost', () => {
    it('should return correct module costs', () => {
      expect(getModuleCost('trains')).toBe(0);
      expect(getModuleCost('police')).toBeGreaterThan(0);
    });

    it('should return 0 for unknown modules', () => {
      expect(getModuleCost('unknown')).toBe(0);
    });
  });

  describe('isModuleFree', () => {
    it('should return true for free modules', () => {
      expect(isModuleFree('trains')).toBe(true);
      expect(isModuleFree('scenery')).toBe(true);
    });

    it('should return false for paid modules', () => {
      expect(isModuleFree('police')).toBe(false);
      expect(isModuleFree('fire')).toBe(false);
    });
  });

  describe('WELCOME_BONUS_TOKENS', () => {
    it('should be a positive number', () => {
      expect(WELCOME_BONUS_TOKENS).toBeGreaterThan(0);
    });

    it('should be 100', () => {
      expect(WELCOME_BONUS_TOKENS).toBe(100);
    });
  });
});
