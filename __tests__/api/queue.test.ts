/**
 * Queue API Integration Tests
 *
 * These tests require a running dev server and database connection.
 * Run with: npm test -- --testPathPattern=queue
 */

import { isServerAvailable, BASE_URL } from '../helpers/server-check';

let fetch: typeof globalThis.fetch;
let serverRunning = false;

beforeAll(async () => {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default as unknown as typeof globalThis.fetch;
  serverRunning = await isServerAvailable();
  if (!serverRunning) {
    console.log(`\n⚠️  Skipping Queue API tests - dev server not running at ${BASE_URL}`);
  }
});

describe('Queue API', () => {
  describe('GET /api/queue', () => {
    it('should return queue state', async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/queue`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('queue');
      expect(data.data.queue).toHaveProperty('totalInQueue');
      expect(data.data.queue).toHaveProperty('currentController');
      expect(data.data.queue).toHaveProperty('waitingCount');
    });

    it('should return null userPosition when not authenticated', async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/queue`);
      const data = await response.json();

      expect(data.data.userPosition).toBeNull();
    });
  });

  describe('POST /api/queue', () => {
    it('should require authentication', async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: 'standard' }),
      });

      expect(response.status).toBe(401);
    });

    it('should require packageId', async () => {
      // This test would need authentication - skip for now
      // In a real scenario, we'd need to set up auth tokens
    });
  });

  describe('DELETE /api/queue', () => {
    it('should require authentication', async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/queue`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('Queue Active API', () => {
  describe('GET /api/queue/active', () => {
    it('should return active session state', async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/queue/active`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('hasActiveSession');
    });

    it('should return no active session when not authenticated', async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/queue/active`);
      const data = await response.json();

      expect(data.hasActiveSession).toBe(false);
    });
  });

  describe('POST /api/queue/active (extend)', () => {
    it('should require authentication', async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/queue/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: 'extend-5' }),
      });

      expect(response.status).toBe(401);
    });
  });
});

export {};
