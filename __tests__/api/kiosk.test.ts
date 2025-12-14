/**
 * Kiosk API Integration Tests
 *
 * These tests require a running dev server and database connection.
 * Run with: npm test -- --testPathPattern=kiosk
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let fetch: typeof globalThis.fetch;

beforeAll(async () => {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default as unknown as typeof globalThis.fetch;
});

describe('Kiosk Coin API', () => {
  describe('GET /api/kiosk/coin', () => {
    it('should return coin acceptor configuration', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('enabled');
      expect(data).toHaveProperty('coinTypes');
      expect(data).toHaveProperty('tokensPerCoin');
      expect(data).toHaveProperty('status');
    });

    it('should return supported coin types', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`);
      const data = await response.json();

      expect(data.coinTypes).toContain('quarter');
      expect(data.coinTypes).toContain('dollar');
      expect(data.coinTypes).toContain('token');
    });

    it('should return tokens per coin values', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`);
      const data = await response.json();

      expect(data.tokensPerCoin.quarter).toBe(1);
      expect(data.tokensPerCoin.dollar).toBe(5);
      expect(data.tokensPerCoin.token).toBe(1);
    });

    it('should return status as ready', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`);
      const data = await response.json();

      expect(data.status).toBe('ready');
    });

    it('should accept cabinetId query parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin?cabinetId=test-cabinet`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cabinetId).toBe('test-cabinet');
    });
  });

  describe('POST /api/kiosk/coin', () => {
    it('should accept coin by type and return tokens', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coinType: 'quarter' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tokensCreated).toBe(1);
    });

    it('should credit more tokens for dollar', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coinType: 'dollar' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tokensCreated).toBe(5);
    });

    it('should accept pulse count for hardware integration', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pulseCount: 3 }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tokensCreated).toBe(3);
    });

    it('should return anonymous flag when not authenticated', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coinType: 'quarter' }),
      });
      const data = await response.json();

      expect(data.anonymous).toBe(true);
    });

    it('should reject request without coinType or pulseCount', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should reject invalid coin type', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coinType: 'invalid' }),
      });

      expect(response.status).toBe(400);
    });

    it('should accept cabinetId for logging', async () => {
      const response = await fetch(`${BASE_URL}/api/kiosk/coin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coinType: 'quarter',
          cabinetId: 'cabinet-001',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

describe('Kiosk Page', () => {
  it('should render kiosk page', async () => {
    const response = await fetch(`${BASE_URL}/kiosk`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
  });

  it('should contain arcade branding', async () => {
    const response = await fetch(`${BASE_URL}/kiosk`);
    const html = await response.text();

    expect(html).toContain('RAILROAD');
    expect(html).toContain('ARCADE');
  });

  it('should contain start button', async () => {
    const response = await fetch(`${BASE_URL}/kiosk`);
    const html = await response.text();

    expect(html).toContain('PRESS START');
  });
});
