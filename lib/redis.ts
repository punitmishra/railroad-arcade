import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// ============================================
// Lazy Redis Initialization
// ============================================

let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash Redis credentials not configured');
    }
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisInstance;
}

// Export getter for redis
export const redis = {
  get: async <T>(key: string) => getRedis().get<T>(key),
  set: async <T>(key: string, value: T, options?: { ex: number }) =>
    options?.ex
      ? getRedis().set(key, value, { ex: options.ex })
      : getRedis().set(key, value),
  del: async (...keys: string[]) => getRedis().del(...keys),
  keys: async (pattern: string) => getRedis().keys(pattern),
  incr: async (key: string) => getRedis().incr(key),
  decr: async (key: string) => getRedis().decr(key),
  expire: async (key: string, seconds: number) => getRedis().expire(key, seconds),
};

// ============================================
// Rate Limiters (lazy initialized)
// ============================================

let apiRateLimitInstance: Ratelimit | null = null;
let authRateLimitInstance: Ratelimit | null = null;
let paymentRateLimitInstance: Ratelimit | null = null;

export const apiRateLimit = {
  limit: async (identifier: string) => {
    if (!apiRateLimitInstance) {
      apiRateLimitInstance = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(100, '10 s'),
        analytics: true,
        prefix: 'ratelimit:api',
      });
    }
    return apiRateLimitInstance.limit(identifier);
  },
};

export const authRateLimit = {
  limit: async (identifier: string) => {
    if (!authRateLimitInstance) {
      authRateLimitInstance = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'ratelimit:auth',
      });
    }
    return authRateLimitInstance.limit(identifier);
  },
};

export const paymentRateLimit = {
  limit: async (identifier: string) => {
    if (!paymentRateLimitInstance) {
      paymentRateLimitInstance = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'ratelimit:payment',
      });
    }
    return paymentRateLimitInstance.limit(identifier);
  },
};

// ============================================
// Cache Helpers
// ============================================

const DEFAULT_CACHE_TTL = 60; // 1 minute default

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error('Redis cache get error:', error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_CACHE_TTL
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error('Redis cache set error:', error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis cache delete error:', error);
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis cache delete pattern error:', error);
  }
}

// ============================================
// User Session Cache
// ============================================

export const userCache = {
  getBalance: async (userId: string): Promise<number | null> => {
    return cacheGet<number>(`user:${userId}:balance`);
  },

  setBalance: async (userId: string, balance: number): Promise<void> => {
    await cacheSet(`user:${userId}:balance`, balance, 300); // 5 min cache
  },

  invalidateBalance: async (userId: string): Promise<void> => {
    await cacheDelete(`user:${userId}:balance`);
  },

  getProfile: async (userId: string) => {
    return cacheGet(`user:${userId}:profile`);
  },

  setProfile: async (userId: string, profile: object): Promise<void> => {
    await cacheSet(`user:${userId}:profile`, profile, 600); // 10 min cache
  },

  invalidateProfile: async (userId: string): Promise<void> => {
    await cacheDelete(`user:${userId}:profile`);
  },

  invalidateAll: async (userId: string): Promise<void> => {
    await cacheDeletePattern(`user:${userId}:*`);
  },
};

// ============================================
// Play Session State (Real-time)
// ============================================

export const playSessionCache = {
  setActive: async (
    sessionId: string,
    state: {
      userId: string;
      startTime: number;
      tokensSpent: number;
      trainsActive: string[];
    }
  ): Promise<void> => {
    await cacheSet(`session:${sessionId}:state`, state, 3600); // 1 hour
  },

  getActive: async (sessionId: string) => {
    return cacheGet<{
      userId: string;
      startTime: number;
      tokensSpent: number;
      trainsActive: string[];
    }>(`session:${sessionId}:state`);
  },

  setUserActiveSession: async (
    userId: string,
    sessionId: string
  ): Promise<void> => {
    await cacheSet(`user:${userId}:activeSession`, sessionId, 3600);
  },

  getUserActiveSession: async (userId: string): Promise<string | null> => {
    return cacheGet<string>(`user:${userId}:activeSession`);
  },

  clearUserActiveSession: async (userId: string): Promise<void> => {
    await cacheDelete(`user:${userId}:activeSession`);
  },

  clearSession: async (sessionId: string): Promise<void> => {
    await cacheDelete(`session:${sessionId}:state`);
  },
};

// ============================================
// Leaderboard/Stats Cache
// ============================================

export const statsCache = {
  getDailyStats: async (date: string) => {
    return cacheGet(`stats:daily:${date}`);
  },

  setDailyStats: async (date: string, stats: object): Promise<void> => {
    await cacheSet(`stats:daily:${date}`, stats, 3600); // 1 hour
  },

  getLeaderboard: async (type: string) => {
    return cacheGet(`leaderboard:${type}`);
  },

  setLeaderboard: async (type: string, data: object[]): Promise<void> => {
    await cacheSet(`leaderboard:${type}`, data, 300); // 5 min
  },
};
