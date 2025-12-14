/**
 * Helper to check if the dev server is running for integration tests
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let serverAvailable: boolean | null = null;

export async function isServerAvailable(): Promise<boolean> {
  if (serverAvailable !== null) {
    return serverAvailable;
  }

  try {
    const nodeFetch = await import('node-fetch');
    const fetch = nodeFetch.default as unknown as typeof globalThis.fetch;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    // Check the leaderboards API as a fingerprint for the railroad-arcade app
    const response = await fetch(`${BASE_URL}/api/leaderboards?mode=FREE_PLAY&limit=1`, {
      signal: controller.signal as AbortSignal,
    });

    clearTimeout(timeout);

    if (response.status !== 200) {
      serverAvailable = false;
      return false;
    }

    // Verify response structure matches railroad-arcade
    const data = await response.json();
    serverAvailable = data.success === true && data.data !== undefined;
    return serverAvailable;
  } catch {
    serverAvailable = false;
    return false;
  }
}

export function skipIfNoServer(): void {
  beforeAll(async () => {
    const available = await isServerAvailable();
    if (!available) {
      console.log(`\n⚠️  Skipping integration tests - dev server not running at ${BASE_URL}`);
      console.log('   Run "npm run dev" in another terminal to enable these tests.\n');
    }
  });
}

export function describeIfServer(name: string, fn: () => void): void {
  describe(name, () => {
    let available = false;

    beforeAll(async () => {
      available = await isServerAvailable();
      if (!available) {
        console.log(`⚠️  Skipping "${name}" - server not available`);
      }
    });

    // Wrap the test function to conditionally skip
    fn();
  });
}

export { BASE_URL };
