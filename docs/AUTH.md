# Authentication System Documentation

This document covers the authentication system implementation, known issues, troubleshooting, and testing procedures.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Known Issues & Solutions](#known-issues--solutions)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Railroad Arcade uses NextAuth.js v4 for authentication with the following providers:
- **Credentials** (email/password) - Always available
- **Google OAuth** - Optional, requires configuration
- **GitHub OAuth** - Optional, requires configuration

New users receive **100 welcome tokens** upon signup.

---

## Architecture

### Components

```
app/
├── api/
│   └── auth/
│       ├── [...nextauth]/route.ts  # NextAuth handler
│       └── signup/route.ts          # Custom signup endpoint
├── login/page.tsx                   # Login page
└── signup/page.tsx                  # Signup page

components/auth/
├── AuthProvider.tsx                 # SessionProvider wrapper
├── LoginForm.tsx                    # Login form component
├── SignupForm.tsx                   # Signup form component
└── UserMenu.tsx                     # User dropdown menu

lib/
├── auth.ts                          # NextAuth configuration
├── db.ts                            # Prisma client
└── redis.ts                         # Rate limiting (optional)
```

### Flow

1. **Signup Flow:**
   ```
   User → SignupForm → POST /api/auth/signup → Create user in DB
                    → signIn('credentials') → Create session
                    → Redirect to home
   ```

2. **Login Flow:**
   ```
   User → LoginForm → signIn('credentials') → NextAuth callback
                   → Verify credentials → Create JWT session
                   → Redirect to callback URL
   ```

3. **Session Management:**
   - JWT-based sessions (not database sessions)
   - 30-day session lifetime
   - Session stored in HTTP-only cookie

---

## Configuration

### Required Environment Variables

```env
# Database (Neon Postgres)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### Optional Environment Variables

```env
# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_ID=""
GITHUB_SECRET=""

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## API Endpoints

### NextAuth Endpoints (handled by `[...nextauth]`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/csrf` | GET | Get CSRF token |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/providers` | GET | List available providers |
| `/api/auth/signin` | GET/POST | Sign in page/action |
| `/api/auth/signout` | GET/POST | Sign out action |
| `/api/auth/callback/:provider` | POST | OAuth/credentials callback |

### Custom Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create new user account |
| `/api/db-test` | GET | Test database connectivity |

### Signup Request/Response

**Request:**
```json
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "minimum8chars",
  "name": "Optional Name"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "name": "Optional Name"
  },
  "message": "Account created successfully! You received 100 welcome tokens."
}
```

**Error Responses:**
- `400` - Validation error (duplicate email, short password, missing fields)
- `429` - Rate limited (if Redis configured)
- `500` - Server error

---

## Known Issues & Solutions

### 1. macOS AirPlay Receiver Intercepting Auth Routes

**Symptom:** All `/api/auth/*` requests return 403 Forbidden with `server: AirTunes` header.

**Cause:** macOS AirPlay Receiver intercepts HTTP requests containing `/auth/` in the URL path.

**Solution:** Disable AirPlay Receiver:
- **macOS Ventura+:** System Settings → General → AirDrop & Handoff → Turn OFF "AirPlay Receiver"
- **macOS Monterey:** System Preferences → Sharing → Uncheck "AirPlay Receiver"

**Detection:**
```bash
curl -v http://localhost:3000/api/auth/csrf 2>&1 | grep "server:"
# If you see "server: AirTunes" → AirPlay is intercepting
```

---

### 2. API Routes Being Proxied to Raspberry Pi

**Symptom:** Auth endpoints return connection errors to port 5000, or "Internal Server Error".

**Cause:** The `next.config.js` had a catch-all rewrite rule:
```javascript
// BAD - forwards ALL /api/* to Raspberry Pi
{
  source: '/api/:path*',
  destination: `${apiUrl}/api/:path*`,
}
```

**Solution:** Use specific rewrites for Raspberry Pi endpoints only:
```javascript
// GOOD - only forwards specific routes
{
  source: '/api/tracks/:path*',
  destination: `${apiUrl}/api/tracks/:path*`,
},
{
  source: '/api/cpx/:path*',
  destination: `${apiUrl}/api/cpx/:path*`,
},
// ... other specific routes
```

**Affected Routes (should NOT be proxied):**
- `/api/auth/*` - NextAuth
- `/api/db-test` - Database test
- `/api/user` - User data
- `/api/sessions` - Play sessions
- `/api/payments/*` - Payment processing
- `/api/queue/*` - Background jobs

---

### 3. Missing Redis Causing Signup Failures

**Symptom:** Signup fails with "Upstash Redis credentials not configured" error.

**Cause:** The signup route had a hard dependency on Redis for rate limiting.

**Solution:** Rate limiting is now optional. It only activates if Redis credentials are configured:
```typescript
// Rate limiting only if Redis is configured
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Apply rate limiting
}
```

---

### 4. Login Returns 403 Without CSRF Token

**Symptom:** POST to `/api/auth/callback/credentials` returns 403.

**Cause:** NextAuth requires a valid CSRF token for all POST requests.

**Solution:** Always fetch CSRF token first:
```bash
# Get CSRF token (also sets session cookie)
CSRF=$(curl -s -c cookies.txt http://localhost:3000/api/auth/csrf | jq -r '.csrfToken')

# Use token in login request
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -b cookies.txt \
  -d "csrfToken=$CSRF&email=...&password=..."
```

---

## Testing

### Test Scripts

```bash
# Run all Jest tests (requires running server)
npm test

# Run auth E2E tests (starts server automatically)
npm run test:auth

# Run auth tests against existing server
npm run test:auth:no-server

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Manual Testing

```bash
# 1. Start the server
npm run dev

# 2. Test database connection
curl http://localhost:3000/api/db-test | jq .

# 3. Test CSRF endpoint
curl http://localhost:3000/api/auth/csrf | jq .

# 4. Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test"}' | jq .

# 5. Test login flow
./scripts/test-auth.sh --no-server
```

### Test Coverage

The test suite covers:

| Category | Tests |
|----------|-------|
| Database | Connection, user count |
| CSRF | Token generation |
| Providers | Credentials provider available |
| Signup | Success, duplicate email, short password, missing fields |
| Login | Success, invalid credentials, session creation |
| Session | Active session, empty session |
| Protected Routes | Unauthorized access |
| Page Routes | Login, signup, main page render |

---

## Troubleshooting

### Debug Checklist

1. **Server not responding:**
   ```bash
   lsof -i :3000  # Check if port is in use
   curl -v http://localhost:3000/  # Verbose request
   ```

2. **Auth routes returning 403:**
   ```bash
   curl -v http://localhost:3000/api/auth/csrf 2>&1 | grep "server:"
   # If "AirTunes" → Disable AirPlay Receiver
   ```

3. **Database connection failing:**
   ```bash
   curl http://localhost:3000/api/db-test | jq .
   # Check DATABASE_URL in .env
   ```

4. **NEXTAUTH_SECRET issues:**
   ```bash
   # Generate new secret
   openssl rand -base64 32
   # Add to .env as NEXTAUTH_SECRET
   ```

5. **Session not persisting:**
   - Check browser cookies for `next-auth.session-token`
   - Verify NEXTAUTH_URL matches actual URL
   - Check NEXTAUTH_SECRET is set

### Server Logs

Watch server logs for detailed errors:
```bash
npm run dev 2>&1 | tee server.log
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED ::1:5000` | Auth routes being proxied | Fix next.config.js rewrites |
| `server: AirTunes` | AirPlay intercepting | Disable AirPlay Receiver |
| `Invalid email or password` | Wrong credentials | Check user exists in DB |
| `CSRF token mismatch` | Missing/invalid CSRF | Get fresh token before login |
| `Upstash Redis credentials not configured` | Old code version | Update signup route |

---

## Security Considerations

1. **Password Storage:** Passwords are hashed with bcrypt (12 rounds)
2. **CSRF Protection:** All mutations require valid CSRF token
3. **Rate Limiting:** Optional but recommended for production
4. **Session Security:** JWT stored in HTTP-only cookie
5. **Secret Management:** Never commit `.env` file

---

## Future Improvements

- [ ] Add email verification
- [ ] Implement password reset flow
- [ ] Add 2FA support
- [ ] Session management UI (view/revoke sessions)
- [ ] OAuth provider management
