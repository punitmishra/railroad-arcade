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

## Remaining Work (Phase 6)

### Integration & Polish
- [ ] Integrate hardware adapters into LiveTrackLayout
- [ ] Add WebSocket/SSE for real-time updates
- [ ] Token enforcement with confirmation dialogs
- [ ] Recording system implementation
- [ ] Achievement triggers

### Production Deployment
- [ ] Environment configuration
- [ ] CDN for camera streams
- [ ] Redis for queue management
- [ ] Monitoring and logging

---

## Git History (Recent)

```
c895c6b Add comprehensive test suite for arcade features
2c5b2cf Add payment and module integration tests
24dbc20 Add demo/live dual-mode arcade with game modes and kiosk support
ae30f8e Add payment integration and fix interactive module persistence
49bf737 Add auth flow fixes, tests, and documentation
397a25b Add full backend infrastructure with auth and payments
```

---

*Last Updated: December 2024*
