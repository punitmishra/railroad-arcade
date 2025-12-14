# Railroad Arcade - Development Notes

## Project Overview

Railroad Arcade is a demo/live dual-mode arcade experience where users can:
- **Demo Mode**: Play for free with full simulation
- **Live Mode**: Control real Raspberry Pi hardware (costs tokens)

---

## Completed Phases

### Phase 1: Mode Architecture & Context System ✅
**Files Created:**
- `lib/contexts/ModeContext.tsx` - GameMode context provider ('demo' | 'live')
- `lib/hardware/HardwareAdapter.ts` - Interface for hardware abstraction
- `lib/hardware/DemoAdapter.ts` - Client-side simulation adapter
- `lib/hardware/LiveAdapter.ts` - Real Pi hardware adapter via API

**Features:**
- Mode switching between demo and live
- Unified hardware control interface
- Subscription-based state updates

---

### Phase 2: Queue System for Live Access ✅
**Files Created:**
- `app/api/queue/route.ts` - GET/POST/DELETE queue operations
- `app/api/queue/active/route.ts` - Active session management
- `app/api/queue/process/route.ts` - Queue processing
- `lib/queue-manager.ts` - Queue logic with Redis support
- `lib/queue.ts` - Queue utilities
- `components/LiveQueuePanel.tsx` - Queue UI component

**Database Models:**
- `LiveQueue` - Queue entries with status, position, timing
- `TokenAction` - Per-action token billing

**Features:**
- Fair access queue for live hardware
- Time-based session management
- Queue position tracking
- Automatic session expiration

---

### Phase 3: Game Modes & Scoring System ✅
**Files Created:**
- `lib/game-modes/GameModeEngine.ts` - Core game engine with scoring
- `lib/pricing.ts` - Token packages, action costs, module pricing
- `components/GameModeSelector.tsx` - Mode selection UI
- `components/GameHUD.tsx` - In-game HUD with score/timer
- `components/LeaderboardPanel.tsx` - High scores display

**Database Models:**
- `GameSession` - Game session tracking with mode and score
- `Leaderboard` - High scores by mode (demo/live separated)

**Game Modes:**
| Mode | Description | Entry Cost |
|------|-------------|------------|
| FREE_PLAY | Sandbox mode | 0 tokens |
| SPEED_RUN | Fastest circuit completion | 10 tokens |
| DELIVERY_MISSION | Cargo transport challenge | 15 tokens |
| SURVIVAL | Avoid collisions | 20 tokens |
| TIME_ATTACK | Score in limited time | 25 tokens |

**Scoring System:**
- Base points per action
- Speed multipliers
- Combo bonuses
- Objective completion rewards

---

### Phase 4: Multi-Camera Feed System ✅
**Files Created:**
- `lib/camera-config.ts` - Camera definitions and layouts
- `components/CameraFeed.tsx` - Single camera stream
- `components/MultiCameraGrid.tsx` - Grid layout renderer
- `components/RecordingControls.tsx` - Recording UI

**Database Models:**
- `Recording` - Recording sessions with status tracking

**Cameras:**
| ID | Name | Description |
|----|------|-------------|
| overhead | Overhead | Bird's eye view |
| station-gc | Grand Central | Main station |
| station-vs | Valley Station | Secondary station |
| tunnel | Tunnel View | Tunnel interior |

**Layouts:**
- Single (1x1), Dual Horizontal (2x1), Quad (2x2), PiP

---

### Phase 5: Physical Arcade Cabinet Support ✅
**Files Created:**
- `lib/kiosk-config.ts` - Kiosk display, input, coin settings
- `lib/arcade-input.ts` - ArcadeInputManager class
- `hooks/useArcadeInput.ts` - React hooks for inputs
- `components/kiosk/KioskTrainControl.tsx` - Large touch controls
- `components/kiosk/KioskCameraView.tsx` - Touch camera viewer
- `app/kiosk/page.tsx` - Full kiosk mode page
- `app/api/kiosk/coin/route.ts` - Coin acceptor API

**Kiosk Features:**
- Fullscreen attract screen with animated logo
- Game mode selection screen
- Large touch-friendly controls
- Keyboard/gamepad mapping support
- Coin acceptor integration (quarter=1, dollar=5 tokens)

**Input Mapping:**
| Key | Action |
|-----|--------|
| Space | Emergency Stop |
| W/S | Throttle Up/Down |
| A/D | Direction Toggle |
| Q/E | Junction Control |
| 1-4 | Camera Switch |
| F | Fullscreen |

---

## Database Schema Summary

### Core Models
- `User` - Extended with tokenBalance, unlockedModules
- `PlaySession` - Session tracking with stats
- `Transaction` - Token purchases/spending

### Arcade Models
- `LiveQueue` - Queue management for live access
- `TokenAction` - Per-action billing
- `GameSession` - Game mode sessions
- `Leaderboard` - High scores
- `Recording` - Camera recordings
- `Achievement` - User achievements

### Enums
- `QueueStatus`: WAITING, ACTIVE, COMPLETED, CANCELLED, EXPIRED
- `ActionType`: TRAIN_START, TRAIN_STOP, JUNCTION_SWITCH, etc.
- `GameMode`: FREE_PLAY, SPEED_RUN, DELIVERY_MISSION, SURVIVAL, TIME_ATTACK
- `RecordingStatus`: RECORDING, PROCESSING, READY, FAILED

---

## Pricing Configuration

### Token Packages
| Package | Tokens | Bonus | Price |
|---------|--------|-------|-------|
| Starter | 50 | 0 | $0.99 |
| Standard | 150 | 25 | $2.99 |
| Value | 400 | 100 | $7.99 |
| Premium | 1000 | 350 | $14.99 |

### Queue Time Packages
| Package | Duration | Tokens |
|---------|----------|--------|
| Quick | 3 min | 5 |
| Standard | 5 min | 10 |
| Extended | 10 min | 18 |

### Action Costs
| Action | Tokens |
|--------|--------|
| Train Start | 2 |
| Train Stop | 0 |
| Junction Switch | 1 |
| Crossing Toggle | 1 |
| Emergency Stop | 0 |

### Module Costs
| Module | Tokens |
|--------|--------|
| Trains | Free |
| Scenery | Free |
| Police | 50 |
| Fire | 50 |
| Ambient | 25 |

---

## Test Suite

### Unit Tests (175 passing)
- `__tests__/lib/game-modes.test.ts` - GameModeEngine
- `__tests__/lib/camera-config.test.ts` - Camera configs
- `__tests__/lib/kiosk-config.test.ts` - Kiosk settings
- `__tests__/lib/pricing.test.ts` - Token/action pricing
- `__tests__/lib/arcade-input.test.ts` - Input handling
- `__tests__/lib/hardware-adapters.test.ts` - DemoAdapter

### Integration Tests (require running server)
- `__tests__/api/queue.test.ts` - Queue API
- `__tests__/api/kiosk.test.ts` - Kiosk/coin API

---

## API Endpoints

### Queue
- `GET /api/queue` - Get queue state
- `POST /api/queue` - Join queue
- `DELETE /api/queue` - Leave queue
- `GET /api/queue/active` - Get active session
- `POST /api/queue/active` - Extend session

### Kiosk
- `GET /api/kiosk/coin` - Coin acceptor config
- `POST /api/kiosk/coin` - Accept coin/credit tokens

### Payments
- `POST /api/payments/stripe` - Stripe checkout
- `POST /api/payments/paypal` - PayPal order
- `POST /api/payments/coinbase` - Coinbase Commerce

### User
- `GET /api/user` - Get user profile
- `GET /api/user/stats` - Get user statistics
- `GET /api/user/sessions` - Get session history
- `GET /api/user/transactions` - Get transaction history
- `GET /api/user/modules` - Get unlocked modules
- `POST /api/user/modules` - Unlock a module

### Admin
- `POST /api/admin/grant-tokens` - Grant tokens to users

---

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Tests
npm test                                    # All tests
npm test -- --testPathPatterns="__tests__/lib"  # Unit tests only

# Database
npx prisma db push    # Sync schema
npx prisma studio     # GUI
```

---

### Phase 6: Integration & Token Enforcement ✅
**Files Created:**
- `lib/token-guard.ts` - Token verification, deduction, refund logic
- `hooks/useHardwareAdapter.ts` - React hook for hardware adapter integration
- `components/TokenConfirmDialog.tsx` - Confirmation dialog with cost display

**Files Modified:**
- `components/LiveTrackLayout.tsx` - Mode awareness and token integration

**Features:**
- Hardware adapter automatically selected based on mode (demo/live)
- Token balance verification before paid actions
- Confirmation dialogs showing cost breakdown
- Real-time balance updates after actions
- Mode indicator in UI (DEMO/LIVE)
- Free actions remain free (emergency stop, train stop)

**Integration Details:**
| Component | Integration |
|-----------|-------------|
| LiveTrackLayout | Uses useHardwareAdapter for unified control |
| Junction/Crossing | Token enforcement via adapterActions |
| Train Control | Start costs tokens, stop is free |
| Emergency Stop | Always free, goes through adapter |

---

### Polish Features ✅

**Real-Time Updates (SSE):**
- `lib/realtime.ts` - Event emitter with SSE stream
- `app/api/realtime/route.ts` - SSE endpoint
- `hooks/useRealtime.ts` - React hooks for events
- Specialized: `useTrainUpdates`, `useQueueUpdates`, `useScoreUpdates`

**Achievement System:**
- `lib/achievements.ts` - 10 achievement types with triggers
- `app/api/achievements/route.ts` - Fetch achievements
- `hooks/useAchievements.ts` - React hook with notifications

| Achievement | Description | Points |
|-------------|-------------|--------|
| FIRST_RUN | Complete first session | 10 |
| SPEED_DEMON | Max speed for 60s | 25 |
| NIGHT_OWL | 10 min night mode | 15 |
| COLLECTOR | Unlock all modules | 50 |
| MARATHON | 100 total laps | 30 |
| EXPLORER | Use all cameras | 15 |
| PHOTOGRAPHER | 10 snapshots | 20 |
| CONDUCTOR | Operate 3 trains | 25 |
| MASTER_ENGINEER | Score 10,000 pts | 100 |
| VETERAN | 50 sessions | 75 |

**Leaderboard Integration:**
- `app/api/leaderboards/route.ts` - Score submission/retrieval
- `hooks/useLeaderboard.ts` - React hooks for rankings
- Real-time updates via SSE

**Recording System:**
- `app/api/recordings/route.ts` - Full CRUD operations
- Start, stop, complete, delete recordings

---

### User Pages & Demo Mode ✅

**New Pages:**
| Page | Path | Description |
|------|------|-------------|
| Profile | `/profile` | User stats, token balance, unlocked modules |
| Achievements | `/achievements` | Achievement progress with earned/locked badges |
| History | `/history` | Session history with stats and filtering |
| Settings | `/settings` | User preferences (dark mode, sounds, notifications) |

**Files Created:**
- `app/profile/page.tsx` - User profile with stats display
- `app/achievements/page.tsx` - Achievement grid with progress bar
- `app/history/page.tsx` - Session history list with filters
- `app/settings/page.tsx` - Preference toggles and account management
- `app/api/user/stats/route.ts` - User statistics endpoint
- `app/api/user/sessions/route.ts` - Session history endpoint
- `app/api/admin/grant-tokens/route.ts` - Admin token management

**Demo Mode Improvements:**
- Auto-start playing when page loads (no "Start Session" button needed)
- All modules unlocked and free in demo mode
- Clear "Free Demo Mode" badge in header
- Token display hidden in demo mode
- Infinite session timer hidden
- Modules show "Free in Demo" label

**Navigation:**
- UserMenu dropdown links to all user pages
- Back navigation from each page to home
- Consistent header styling across pages

---

## Remaining Work

### Production Deployment
- [ ] Environment configuration
- [ ] CDN for camera streams
- [ ] Redis for queue management
- [ ] Monitoring and logging

---

## Git History (Recent)

```
ebd08e0 Fix failing integration tests
52eed83 Add missing pages and smooth demo mode experience
0f04068 Update development notes with polish features
5daf058 Add real-time updates, achievements, leaderboards, and recordings
ee981e1 Update development notes with Phase 6 completion
40ee858 Implement Phase 6: Hardware adapter integration and token enforcement
```

---

## Test Summary

| Test Suite | Tests |
|------------|-------|
| game-modes.test.ts | GameModeEngine scoring |
| camera-config.test.ts | Camera configurations |
| kiosk-config.test.ts | Kiosk settings |
| pricing.test.ts | Token/action pricing |
| arcade-input.test.ts | Input handling |
| hardware-adapters.test.ts | DemoAdapter control |
| token-guard.test.ts | Token enforcement |
| auth.test.ts | Authentication flows |
| payments.test.ts | Payment system integration |
| queue.test.ts | Queue API |
| kiosk.test.ts | Kiosk/coin API |
| **Total** | **251 passing** |

---

*Last Updated: December 2024*
