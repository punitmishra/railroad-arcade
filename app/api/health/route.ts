import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/redis';
import { logger } from '@/lib/logger';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ServiceCheck;
    redis: ServiceCheck;
  };
}

interface ServiceCheck {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

const startTime = Date.now();

// GET /api/health - Health check endpoint
export async function GET() {
  const checks: HealthCheck['checks'] = {
    database: { status: 'down' },
    redis: { status: 'down' },
  };

  // Check database
  const dbUrl = process.env.DATABASE_URL || '';
  const isDbConfigured = dbUrl && !dbUrl.includes('placeholder');

  if (!isDbConfigured) {
    // Database not configured yet - mark as degraded but not down
    checks.database = {
      status: 'up',
      error: 'Database not configured (using placeholder)',
    };
  } else {
    try {
      const dbStart = Date.now();
      await db.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'up',
        latencyMs: Date.now() - dbStart,
      };
    } catch (error) {
      logger.error('Health check: Database failed', error);
      checks.database = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Check Redis (optional service)
  const healthCheckKey = 'health:check';
  try {
    const redisStart = Date.now();
    await cacheSet(healthCheckKey, Date.now(), 60);
    const result = await cacheGet<number>(healthCheckKey);
    if (result !== null) {
      checks.redis = {
        status: 'up',
        latencyMs: Date.now() - redisStart,
      };
    } else {
      // Redis is optional - mark as up if not configured or result is null
      checks.redis = { status: 'up' };
    }
  } catch (error) {
    // Redis is optional, so we don't fail the health check
    // If credentials aren't configured, cacheSet/cacheGet catch errors internally
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if (errorMsg.includes('not configured')) {
      // Redis is not configured - that's OK
      checks.redis = { status: 'up' };
    } else {
      logger.warn('Health check: Redis unavailable', undefined, error instanceof Error ? error : undefined);
      checks.redis = {
        status: 'down',
        error: errorMsg,
      };
    }
  }

  // Determine overall status
  const isDbUp = checks.database.status === 'up';
  const isRedisUp = checks.redis.status === 'up';

  let status: HealthCheck['status'];
  if (isDbUp && isRedisUp) {
    status = 'healthy';
  } else if (isDbUp) {
    // Database is required, Redis is optional
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  const health: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };

  // Return appropriate status code
  const statusCode = status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, { status: statusCode });
}

// HEAD /api/health - Quick health check (just status code)
export async function HEAD() {
  const dbUrl = process.env.DATABASE_URL || '';
  const isDbConfigured = dbUrl && !dbUrl.includes('placeholder');

  if (!isDbConfigured) {
    // Database not configured - app is still running
    return new NextResponse(null, { status: 200 });
  }

  try {
    await db.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
