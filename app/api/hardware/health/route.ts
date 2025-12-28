// ============================================
// Hardware Health Check API
// ============================================
// Checks if the Raspberry Pi Rust backend is
// online and responding. Caches result briefly.

import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const HEALTH_CACHE_KEY = 'hardware:health';
const HEALTH_CACHE_TTL = 10; // Cache for 10 seconds
const HEALTH_CHECK_TIMEOUT = 5000; // 5 second timeout

interface HealthStatus {
  online: boolean;
  lastChecked: number;
  latency?: number;
  error?: string;
  systemStatus?: {
    controller: boolean;
    cpx: boolean;
    camera: boolean;
    tracksCount: number;
  };
}

async function checkHardwareHealth(): Promise<HealthStatus> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return {
      online: false,
      lastChecked: Date.now(),
      error: 'Hardware API URL not configured',
    };
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${apiUrl}/api/status`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeout);

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        online: false,
        lastChecked: Date.now(),
        latency,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        online: false,
        lastChecked: Date.now(),
        latency,
        error: data.error || 'Unknown error',
      };
    }

    return {
      online: true,
      lastChecked: Date.now(),
      latency,
      systemStatus: {
        controller: data.data?.controller ?? false,
        cpx: data.data?.cpx ?? false,
        camera: data.data?.camera ?? false,
        tracksCount: data.data?.tracks?.length ?? 0,
      },
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        online: false,
        lastChecked: Date.now(),
        latency,
        error: 'Connection timeout',
      };
    }

    return {
      online: false,
      lastChecked: Date.now(),
      latency,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export async function GET() {
  try {
    // Check cache first
    const cached = await redis.get<HealthStatus>(HEALTH_CACHE_KEY);

    if (cached) {
      return NextResponse.json({
        success: true,
        ...cached,
        cached: true,
      });
    }

    // Perform health check
    const health = await checkHardwareHealth();

    // Cache the result
    await redis.set(HEALTH_CACHE_KEY, health, { ex: HEALTH_CACHE_TTL });

    return NextResponse.json({
      success: true,
      ...health,
      cached: false,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        success: false,
        online: false,
        lastChecked: Date.now(),
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Force refresh endpoint (bypasses cache)
export async function POST() {
  try {
    // Clear cache
    await redis.del(HEALTH_CACHE_KEY);

    // Perform fresh health check
    const health = await checkHardwareHealth();

    // Cache the result
    await redis.set(HEALTH_CACHE_KEY, health, { ex: HEALTH_CACHE_TTL });

    return NextResponse.json({
      success: true,
      ...health,
      cached: false,
    });
  } catch (error) {
    console.error('Health check refresh failed:', error);
    return NextResponse.json(
      {
        success: false,
        online: false,
        lastChecked: Date.now(),
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
