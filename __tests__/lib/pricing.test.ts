/**
 * Pricing Configuration Unit Tests
 */

import {
  QUEUE_TIME_PACKAGES,
  ACTION_PRICING,
  MODULE_COSTS,
  TOKEN_PACKAGES,
  calculateActionCost,
  calculateTimePackageCost,
  formatTokenAmount,
  formatDuration,
  getPopularPackage,
  getBestValuePackage,
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

  describe('MODULE_COSTS', () => {
    it('should have costs for all modules', () => {
      expect(MODULE_COSTS.TRAIN_TRACKING).toBeDefined();
      expect(MODULE_COSTS.POLICE_STATION).toBeDefined();
      expect(MODULE_COSTS.FIRE_STATION).toBeDefined();
    });

    it('should have non-negative costs', () => {
      Object.values(MODULE_COSTS).forEach(cost => {
        expect(cost).toBeGreaterThanOrEqual(0);
      });
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

  describe('calculateActionCost', () => {
    it('should return correct cost for known actions', () => {
      expect(calculateActionCost('TRAIN_START')).toBe(ACTION_PRICING.TRAIN_START);
      expect(calculateActionCost('TRAIN_STOP')).toBe(0);
    });

    it('should return 0 for unknown actions', () => {
      expect(calculateActionCost('UNKNOWN_ACTION')).toBe(0);
    });
  });

  describe('calculateTimePackageCost', () => {
    it('should return correct cost for valid package ID', () => {
      const pkg = QUEUE_TIME_PACKAGES[0];
      expect(calculateTimePackageCost(pkg.id)).toBe(pkg.tokens);
    });

    it('should return 0 for invalid package ID', () => {
      expect(calculateTimePackageCost('invalid')).toBe(0);
    });
  });

  describe('formatTokenAmount', () => {
    it('should format token amounts correctly', () => {
      expect(formatTokenAmount(1)).toBe('1 token');
      expect(formatTokenAmount(5)).toBe('5 tokens');
      expect(formatTokenAmount(0)).toBe('0 tokens');
    });

    it('should handle singular/plural correctly', () => {
      expect(formatTokenAmount(1)).toContain('token');
      expect(formatTokenAmount(1)).not.toContain('tokens');
      expect(formatTokenAmount(2)).toContain('tokens');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(120)).toBe('2:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(300)).toBe('5:00');
    });

    it('should handle single digit seconds', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(61)).toBe('1:01');
    });
  });

  describe('getPopularPackage', () => {
    it('should return the popular time package', () => {
      const popular = getPopularPackage();
      expect(popular).toBeDefined();
      expect(popular?.popular).toBe(true);
    });
  });

  describe('getBestValuePackage', () => {
    it('should return the best value token package', () => {
      const bestValue = getBestValuePackage();
      expect(bestValue).toBeDefined();
    });

    it('should return package with highest tokens per dollar', () => {
      const bestValue = getBestValuePackage();
      if (bestValue) {
        const bestRatio = (bestValue.tokens + (bestValue.bonus || 0)) / bestValue.price;
        TOKEN_PACKAGES.forEach(pkg => {
          const ratio = (pkg.tokens + (pkg.bonus || 0)) / pkg.price;
          expect(ratio).toBeLessThanOrEqual(bestRatio + 0.001); // Allow small floating point variance
        });
      }
    });
  });
});
