# Testing Documentation

This document provides comprehensive documentation for the Railroad Arcade test suite.

## Overview

| Metric | Value |
|--------|-------|
| Total Test Suites | 12 |
| Total Tests | 298 |
| Framework | Jest 30 |
| Test Types | Unit, Integration |

## Quick Start

```bash
# Run all tests
npm test

# Run unit tests only (no server required)
npm run test:unit

# Run integration tests only (requires dev server)
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=api.test

# Run auth flow tests (with server)
npm run test:auth
```

## Test Categories

### Unit Tests (`__tests__/lib/`)

Unit tests do not require a running server and test isolated functionality.

| File | Tests | Description |
|------|-------|-------------|
| `api.test.ts` | 76 | API client library |
| `hardware-adapters.test.ts` | ~30 | Hardware abstraction layer |
| `game-modes.test.ts` | ~40 | Game mode engine |
| `pricing.test.ts` | ~25 | Token pricing configuration |
| `token-guard.test.ts` | ~15 | Token cost enforcement |
| `camera-config.test.ts` | ~35 | Camera system configuration |
| `arcade-input.test.ts` | ~25 | Input manager (keyboard/gamepad) |
| `kiosk-config.test.ts` | ~30 | Kiosk cabinet configuration |

### Integration Tests (`__tests__/api/`)

Integration tests require a running dev server (`npm run dev`).

| File | Tests | Description |
|------|-------|-------------|
| `auth.test.ts` | ~15 | Authentication flow |
| `payments.test.ts` | ~25 | Payment and module system |
| `queue.test.ts` | ~10 | Queue API endpoints |
| `kiosk.test.ts` | ~15 | Kiosk coin acceptor API |

---

## Detailed Test Documentation

### 1. API Client Tests (`__tests__/lib/api.test.ts`)

Tests the Raspberry Pi API client library for hardware communication.

#### Test Groups

**ApiError Class**
- Should create error with status and message
- Should store response body
- Should be instanceof Error

**Type Definitions**
- TrackState interface validation
- TrainControl interface validation
- SensorData interface validation
- SystemStatus interface validation

**API Endpoints - Tracks**
- `GET /api/tracks` - Fetch all tracks
- `GET /api/tracks/:id` - Fetch single track
- `POST /api/tracks/:id/train` - Update train control
- `POST /api/tracks/:id/junction` - Control junction
- `POST /api/tracks/:id/crossing` - Control crossing

**API Endpoints - CPX**
- `GET /api/cpx` - Get CPX board status
- `POST /api/cpx/:id/led` - Control LED
- `POST /api/cpx/:id/neopixel` - Control NeoPixel
- `POST /api/cpx/:id/servo` - Control servo

**API Endpoints - Camera**
- `GET /api/stream/:id` - Get camera stream URL
- `POST /api/camera/snapshot` - Capture snapshot
- `GET /api/camera/recordings` - List recordings

**API Endpoints - Distance Sensors**
- `GET /api/distance` - Get all sensor readings
- `GET /api/distance/:id` - Get specific sensor

**API Endpoints - Scenery**
- `GET /api/scenery` - Get scenery state
- `POST /api/scenery/:id` - Control scenery element

**API Endpoints - Schedules**
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule
- `DELETE /api/schedules/:id` - Delete schedule

**API Endpoints - Automation**
- `GET /api/automation` - Get automation rules
- `POST /api/automation` - Create rule
- `PUT /api/automation/:id` - Update rule

**Error Handling**
- Network error handling
- Invalid JSON response handling
- HTTP error status handling
- Timeout handling

---

### 2. Hardware Adapters Tests (`__tests__/lib/hardware-adapters.test.ts`)

Tests the hardware abstraction layer that allows demo and live mode operation.

#### DemoAdapter Tests

**System Status**
- Should return initial system status
- Should have correct structure (trains, junctions, crossing)

**Train Control**
- `setTrainSpeed` - Update train speed (0-100)
- `setTrainDirection` - Set forward/reverse direction
- `stopTrain` - Stop specific train
- `emergencyStop` - Stop all trains immediately

**Junction Control**
- `toggleJunction` - Toggle junction state
- `setJunctionState` - Set specific junction position

**Crossing Control**
- `toggleCrossing` - Toggle crossing gates
- `getCrossingState` - Get current crossing state

**Signal Control**
- `setSignal` - Set signal color (red/yellow/green)
- `getSignalState` - Get current signal state

**Scenery Control**
- `toggleSceneryPower` - Toggle power to scenery element
- `setSceneryBrightness` - Set LED brightness

#### Singleton Pattern
- Should return same instance on multiple calls
- Should properly reset instance

---

### 3. Game Modes Tests (`__tests__/lib/game-modes.test.ts`)

Tests the game mode engine for all supported game modes.

#### Factory Function
- `createGameMode('FREE_PLAY')` - Create Free Play mode
- `createGameMode('SPEED_RUN')` - Create Speed Run mode
- `createGameMode('DELIVERY_MISSION')` - Create Delivery Mission mode
- `createGameMode('SURVIVAL')` - Create Survival mode
- `createGameMode('TIME_ATTACK')` - Create Time Attack mode

#### Game Lifecycle
- `start()` - Start game, set initial state
- `pause()` - Pause game, stop timer
- `resume()` - Resume paused game
- `end()` - End game, calculate final score
- State transitions (pending → active → paused → ended)

#### Scoring System
- `addScore(type, reason)` - Add points
- Base score calculation
- Multiplier application
- Combo tracking

#### Timed Modes (Speed Run, Time Attack)
- Time countdown
- Time remaining calculation
- Auto-end on time expiry
- Timer pause/resume

#### Objectives (Delivery Mission)
- Objective tracking
- Objective completion
- Bonus points for completion

#### Statistics
- Track time played
- Track actions taken
- Track checkpoints reached
- Track deliveries completed

---

### 4. Pricing Tests (`__tests__/lib/pricing.test.ts`)

Tests token pricing configuration and utility functions.

#### Time Packages
- `QUEUE_TIME_PACKAGES` - Initial time purchase options
- `EXTEND_TIME_PACKAGES` - Session extension options
- Package validation (id, tokens, duration, label)

#### Action Pricing
- `ACTION_PRICING` - Token costs per action
- Train start cost
- Junction toggle cost
- Crossing toggle cost
- Signal change cost

#### Token Packages
- `TOKEN_PACKAGES` - Standard purchase options
- `CRYPTO_PACKAGES` - Cryptocurrency purchase options
- Price and token amount validation

#### Module Costs
- `MODULE_COSTS` - Building module unlock costs
- Cafe, Police, Fire, Warehouse modules

#### Utility Functions
- `getTimePricingById(id)` - Get package by ID
- `getActionCost(action)` - Get action token cost
- `formatPrice(cents)` - Format price for display
- `getTokenValue(packageId)` - Get tokens per dollar
- `calculateDiscount(packageId)` - Calculate package discount

---

### 5. Token Guard Tests (`__tests__/lib/token-guard.test.ts`)

Tests token cost enforcement based on game mode.

#### Demo Mode
- All actions should be free (cost 0)
- Should not deduct tokens
- Should allow all actions

#### Live Mode
- Actions should cost actual token amounts
- Should enforce sufficient balance
- Should reject insufficient balance
- Should deduct correct amounts

#### Mode Switching
- Demo to live transition
- Live to demo transition
- Cost updates on mode change

#### Action Execution
- Execute action with callback
- Error handling in callback
- Token refund on failure

---

### 6. Queue API Tests (`__tests__/api/queue.test.ts`)

Tests the live mode queue system API endpoints.

#### GET /api/queue
- Returns queue state (position, wait time)
- Returns empty queue when no users
- Returns estimated wait time

#### POST /api/queue (Join Queue)
- Requires authentication (401)
- Adds user to queue
- Returns position and estimated wait

#### DELETE /api/queue (Leave Queue)
- Requires authentication (401)
- Removes user from queue
- Returns success confirmation

#### GET /api/queue/active
- Returns current active session
- Returns null when no active session
- Returns session time remaining

---

### 7. Auth API Tests (`__tests__/api/auth.test.ts`)

Tests the authentication flow and session management.

**Prerequisites**: Requires running dev server and valid DATABASE_URL.

#### Database Connection
- Should connect successfully
- Returns user count and PostgreSQL version

#### CSRF Token
- Returns valid CSRF token
- Token is non-empty string

#### Auth Providers
- Returns available providers
- Credentials provider configured correctly

#### Signup Flow
- Creates new user with 100 welcome tokens
- Rejects duplicate email
- Rejects short passwords (< 8 chars)
- Rejects missing required fields

#### Login Flow
- Gets CSRF token with session cookie
- Authenticates with valid credentials (returns 302)
- Rejects invalid credentials

#### Session
- Returns empty session when not authenticated

#### Protected Routes
- `/api/user` returns 401 without auth

#### Page Routes
- `/login` renders login page
- `/signup` renders signup page
- `/` renders main page

---

### 8. Payments API Tests (`__tests__/api/payments.test.ts`)

Tests payment system and module unlock functionality.

**Prerequisites**: Requires running dev server.

#### User Profile API
- Returns user profile with token balance
- New users have 100 welcome tokens
- Returns 401 without authentication

#### Modules API
- Returns default modules for unauthenticated users
- Returns user modules when authenticated
- Unlocks module and deducts tokens
- Rejects already unlocked modules
- Rejects invalid module IDs
- Rejects incorrect cost amounts

#### Sessions API
- Starts session and deducts tokens
- Rejects duplicate active sessions
- Returns 401 without authentication
- Rejects invalid duration (< 60s)

#### Transactions API
- Returns transaction history
- Returns 401 without authentication

#### Payment APIs (Auth Check)
- Stripe API requires authentication
- PayPal API requires authentication
- Coinbase API requires authentication

#### Payment Pages
- `/payment/success` renders correctly
- `/payment/success?tokens=150` handles parameter
- `/payment/cancel` renders correctly

---

### 9. Kiosk API Tests (`__tests__/api/kiosk.test.ts`)

Tests the arcade cabinet coin acceptor integration.

#### GET /api/kiosk/coin
- Returns coin acceptor configuration
- Returns supported coin types (quarter, dollar, token)
- Returns tokens per coin values (1, 5, 1)
- Returns status as 'ready'
- Accepts cabinetId query parameter

#### POST /api/kiosk/coin
- Accepts coin by type, returns tokens
- Credits more tokens for dollar (5 vs 1)
- Accepts pulse count for hardware integration
- Returns anonymous flag when not authenticated
- Rejects request without coinType or pulseCount
- Rejects invalid coin type
- Accepts cabinetId for logging

#### Kiosk Page
- Renders kiosk page
- Contains arcade branding (RAILROAD, ARCADE)
- Contains start button

---

### 10. Camera Config Tests (`__tests__/lib/camera-config.test.ts`)

Tests camera system configuration.

#### CAMERAS Array
- Has at least 6 cameras defined
- Has unique camera IDs
- Has all required properties (id, name, description, streamUrl, position, level)
- Has exactly one primary camera
- Has valid positions (overhead, station, tunnel, junction, scenic)

#### CAMERA_LAYOUTS Array
- Has 5 layouts defined
- Has unique layout IDs
- Has valid slot counts (1-4)
- Has grid classes defined

#### getCameraById
- Returns camera for valid ID
- Returns undefined for invalid ID

#### getCamerasByLevel
- Returns cameras for level 0 (includes overhead)
- Returns level 0 cameras plus specific level cameras

#### getPrimaryCamera
- Returns the primary camera
- Returns overhead as primary

#### getLayoutById
- Returns layout for valid ID
- Returns undefined for invalid ID
- Returns correct slot count (single=1, dual-h=2, dual-v=2, quad=4, pip=2)

#### buildStreamUrl
- Returns empty string for invalid camera
- Returns placeholder URL when API URL not configured
- Returns stream URL when API URL is configured

#### DEFAULT_VIEW_CONFIG
- Has valid default layout (single)
- Has valid default cameras (overhead)

#### PRESET_VIEWS
- Has overview preset (single layout)
- Has stations preset (dual-h layout, 2 cameras)
- Has action preset (pip layout)
- Has all preset (quad layout, 4 cameras)
- Only references valid camera IDs

---

### 11. Arcade Input Tests (`__tests__/lib/arcade-input.test.ts`)

Tests the input manager for keyboard and gamepad support.

#### Lifecycle
- Start and stop without errors
- Does not start twice
- Adds event listeners on start
- Removes event listeners on stop

#### Keyboard Events
- Emits press event for mapped key
- Emits release event for mapped key
- Emits repeat event for held key
- Does not emit for unmapped keys
- Prevents default for mapped keys

#### Subscription
- Add and remove subscribers
- Supports multiple subscribers

#### State Queries
- `isKeyPressed(code)` - Tracks pressed keys
- `isActionPressed(action)` - Checks if action is pressed

#### Mapping Updates
- `updateKeyboardMapping` - Updates key bindings

#### Singleton Pattern
- Returns same instance
- Creates new instance after reset

---

### 12. Kiosk Config Tests (`__tests__/lib/kiosk-config.test.ts`)

Tests arcade cabinet configuration.

#### DEFAULT_DISPLAY_CONFIG
- Fullscreen enabled by default
- Landscape orientation
- Cursor hidden
- Valid resolution (width/height > 0)
- Screensaver timeout configured

#### DEFAULT_KEYBOARD_MAPPING
- WASD mapped for train 1 (throttle, stop, reverse)
- Arrow keys mapped for train 2
- Spacebar for emergency stop
- Number keys for junction controls
- Enter/P for game controls
- Brackets for camera controls

#### DEFAULT_GAMEPAD_MAPPING
- Has button mappings
- A/B buttons for confirm/cancel
- Has axes configuration
- Valid axis thresholds (0-1)

#### DEFAULT_COIN_CONFIG
- Coin acceptor disabled by default
- Endpoint defined (/api/kiosk/coin)
- Token values for coin types (quarter=1, dollar=5)

#### DEFAULT_SESSION_CONFIG
- Has idle timeout
- Attract mode enabled
- Free play mode enabled
- Show leaderboard enabled

#### DEFAULT_AUDIO_CONFIG
- Audio enabled
- Valid volume levels (0-1)
- Sound file paths defined

#### DEFAULT_KIOSK_CONFIG
- Contains all config sections

#### getActionForKey
- Returns action for valid key
- Returns null for unmapped key

#### getActionForButton
- Returns action for valid button
- Returns null for unmapped button

#### loadKioskConfig / saveKioskConfig
- Returns default config when no stored config
- Saves and loads custom config

---

## Test Helpers

### Server Check (`__tests__/helpers/server-check.ts`)

Provides utilities for integration tests that require a running dev server.

```typescript
import { isServerAvailable, BASE_URL } from '../helpers/server-check';

// Check if server is available
const available = await isServerAvailable();

// Skip test if server not running
if (!serverRunning) return;
```

**Exports:**
- `isServerAvailable()` - Check if dev server is running
- `skipIfNoServer()` - beforeAll hook to skip tests
- `describeIfServer(name, fn)` - Conditional describe block
- `BASE_URL` - Server URL (default: http://localhost:3000)

---

## Environment Variables

### Required for Unit Tests
None - unit tests run without any environment configuration.

### Required for Integration Tests

```env
DATABASE_URL=postgresql://...     # Neon PostgreSQL connection
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Optional

```env
TEST_BASE_URL=http://localhost:3000  # Override test server URL
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx prisma db push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      - run: npm run dev &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          NEXTAUTH_SECRET: test-secret
          NEXTAUTH_URL: http://localhost:3000
      - run: sleep 10  # Wait for server
      - run: npm run test:integration
```

---

## Writing New Tests

### Unit Test Template

```typescript
/**
 * Example Unit Test
 */
import { myFunction } from '@/lib/my-module';

describe('MyModule', () => {
  describe('myFunction', () => {
    it('should do something', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

### Integration Test Template

```typescript
/**
 * Example Integration Test
 */
import { isServerAvailable, BASE_URL } from '../helpers/server-check';

let fetch: typeof globalThis.fetch;
let serverRunning = false;

beforeAll(async () => {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default as unknown as typeof globalThis.fetch;
  serverRunning = await isServerAvailable();
});

describe('My API Endpoint', () => {
  it('should return expected data', async () => {
    if (!serverRunning) return;

    const response = await fetch(`${BASE_URL}/api/my-endpoint`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('expectedField');
  });
});
```

---

## Troubleshooting

### Tests Fail with "Cannot find module"

Run `npm install` to ensure all dependencies are installed, then try:
```bash
npm run build  # Ensures Prisma client is generated
npm test
```

### Integration Tests Skip

Integration tests require a running dev server:
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:integration
```

### Database Connection Errors

Ensure `DATABASE_URL` is set and the database is accessible:
```bash
npx prisma db push  # Sync schema
npm test
```

### Timeout Errors

Increase Jest timeout for slow operations:
```typescript
jest.setTimeout(30000); // 30 seconds

// Or per-test
it('slow test', async () => {
  // ...
}, 30000);
```
