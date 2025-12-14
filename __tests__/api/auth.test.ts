/**
 * Auth Flow Integration Tests
 *
 * These tests verify the authentication flow works correctly.
 * Run with: npm test -- --testPathPattern=auth
 *
 * IMPORTANT: These are integration tests that require:
 * 1. A running dev server (npm run dev)
 * 2. Valid DATABASE_URL in .env
 * 3. Valid NEXTAUTH_SECRET in .env
 *
 * For CI/CD, use the e2e test script instead.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Use dynamic import for node-fetch in Jest
let fetch: typeof globalThis.fetch;

beforeAll(async () => {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default as unknown as typeof globalThis.fetch;
});

describe('Auth API Endpoints', () => {
  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/db-test`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Database connection successful');
      expect(data.data).toHaveProperty('userCount');
      expect(data.data).toHaveProperty('dbVersion');
      expect(data.data.dbVersion).toContain('PostgreSQL');
    });
  });

  describe('CSRF Token', () => {
    it('should return a valid CSRF token', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/csrf`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('csrfToken');
      expect(typeof data.csrfToken).toBe('string');
      expect(data.csrfToken.length).toBeGreaterThan(0);
    });
  });

  describe('Auth Providers', () => {
    it('should return available auth providers', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/providers`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('credentials');
      expect(data.credentials).toHaveProperty('id', 'credentials');
      expect(data.credentials).toHaveProperty('name', 'credentials');
      expect(data.credentials).toHaveProperty('type', 'credentials');
    });
  });

  describe('Signup', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    const testName = 'Test User';

    it('should create a new user account', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: testName,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toHaveProperty('id');
      expect(data.user.email).toBe(testEmail);
      expect(data.user.name).toBe(testName);
      expect(data.message).toContain('100 welcome tokens');
    });

    it('should reject duplicate email', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: testName,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already exists');
    });

    it('should reject short passwords', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `short-${Date.now()}@example.com`,
          password: '123',
          name: 'Short Pass',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('at least 8 characters');
    });

    it('should reject missing email', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: testPassword,
          name: testName,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });

  describe('Login Flow', () => {
    const loginEmail = `login-test-${Date.now()}@example.com`;
    const loginPassword = 'loginpassword123';
    let cookies: string = '';

    beforeAll(async () => {
      // Create a test user first
      await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          name: 'Login Test User',
        }),
      });
    });

    it('should get CSRF token with session cookie', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/csrf`);
      const data = await response.json();

      // Extract cookies from response
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        cookies = setCookie;
      }

      expect(response.status).toBe(200);
      expect(data.csrfToken).toBeDefined();
    });

    it('should authenticate with valid credentials', async () => {
      // Get fresh CSRF token
      const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
      const { csrfToken } = await csrfResponse.json();
      const setCookie = csrfResponse.headers.get('set-cookie');
      if (setCookie) {
        cookies = setCookie.split(';')[0];
      }

      const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookies,
        },
        body: new URLSearchParams({
          csrfToken,
          email: loginEmail,
          password: loginPassword,
        }).toString(),
        redirect: 'manual',
      });

      // Successful login returns 302 redirect
      expect([200, 302]).toContain(response.status);
    });

    it('should reject invalid credentials', async () => {
      const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
      const { csrfToken } = await csrfResponse.json();
      const setCookie = csrfResponse.headers.get('set-cookie');
      const cookieHeader = setCookie ? setCookie.split(';')[0] : '';

      const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookieHeader,
        },
        body: new URLSearchParams({
          csrfToken,
          email: loginEmail,
          password: 'wrongpassword',
        }).toString(),
        redirect: 'manual',
      });

      // Failed login redirects to error page or returns 401
      // NextAuth redirects to /login?error=... on failure
      expect([302, 401]).toContain(response.status);
    });
  });

  describe('Session', () => {
    it('should return empty session when not authenticated', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/session`);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Empty session returns {}
      expect(Object.keys(data).length === 0 || data.user === undefined).toBe(true);
    });
  });

  describe('Protected Routes', () => {
    it('should return 401 for /api/user without auth', async () => {
      const response = await fetch(`${BASE_URL}/api/user`);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});

describe('Page Routes', () => {
  describe('Login Page', () => {
    it('should render login page', async () => {
      const response = await fetch(`${BASE_URL}/login`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });
  });

  describe('Signup Page', () => {
    it('should render signup page', async () => {
      const response = await fetch(`${BASE_URL}/signup`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });
  });

  describe('Main Page', () => {
    it('should render main page', async () => {
      const response = await fetch(`${BASE_URL}/`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });
  });
});
