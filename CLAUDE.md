# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build (runs prisma generate first)
npm run start    # Run production server
npm run lint     # Run ESLint
```

## Project Overview

Railroad Arcade is a Next.js 14 App Router application for controlling a 2-level HO scale model railroad. It features:

- **Dual-mode operation**: Demo (simulation) and Live (real hardware via Raspberry Pi)
- **Token-based access**: Pay-to-play arcade model with multiple payment providers
- **Game modes**: Free Play, Speed Run, Delivery Mission, Survival, Time Attack
- **Kiosk mode**: Full-screen arcade cabinet support
- **Leaderboards**: High scores by game mode

**Live Site:** https://railroad-arcade-v5.vercel.app

## Architecture

### Directory Structure

```
app/                          # Next.js App Router
├── api/                      # API routes (all server-side)
│   ├── admin/                # Admin endpoints (tournaments, tokens)
│   ├── auth/                 # NextAuth endpoints
│   ├── payments/             # Stripe, PayPal, Coinbase
│   ├── leaderboards/         # Game leaderboards
│   ├── queue/                # Live mode queue system + job processing
│   ├── tournaments/          # Tournament API (CRUD, register, submit, leaderboard)
│   └── user/                 # User data (stats, sessions, transactions)
├── admin/tournaments/        # Admin tournament management UI
├── kiosk/page.tsx            # Arcade cabinet mode
├── leaderboards/page.tsx     # Leaderboards UI
├── settings/page.tsx         # User settings
├── profile/page.tsx          # User profile
└── page.tsx                  # Main arcade page

components/
├── auth/                     # Login, Signup, UserMenu
├── kiosk/                    # KioskTrainControl, KioskCameraView
├── icons.tsx                 # 60+ custom SVG icons
├── ui.tsx                    # Core UI: ArcadeButton, ModulePanel, Skeleton, etc.
├── LiveTrackLayout.tsx       # Main track visualization (SVG-based)
├── GameModeSelector.tsx      # Game mode selection UI
├── GameHUD.tsx               # In-game heads-up display
├── ModeToggle.tsx            # Demo/Live mode switcher
├── TokenConfirmDialog.tsx    # Token spending confirmation
├── SnapshotGallery.tsx       # Photo gallery with filters
├── SessionHistory.tsx        # Session log with timeline/stats
├── MultiCameraGrid.tsx       # Multi-view camera layouts
├── CameraFeed.tsx            # Individual camera stream
└── TournamentBanner.tsx      # Tournament display component

hooks/
├── useUser.ts                # User state, tokens, modules
├── useLeaderboard.ts         # Leaderboard data fetching
├── useHardwareAdapter.ts     # Hardware abstraction layer
├── useArcadeInput.ts         # Keyboard/gamepad input
├── useSnapshots.ts           # Snapshot gallery data
├── useSessionHistory.ts      # Session history with pagination
├── useTournament.ts          # Tournament data and actions
└── useSounds.tsx             # Synthesized arcade sounds

lib/
├── contexts/ModeContext.tsx  # Demo/Live mode context
├── game-modes/               # Game mode engines
│   └── GameModeEngine.ts     # Base engine + mode configs
├── hardware/                 # Hardware adapters
│   ├── HardwareAdapter.ts    # Interface definition
│   ├── DemoAdapter.ts        # Simulation adapter
│   └── LiveAdapter.ts        # Real hardware adapter
├── admin.ts                  # Admin auth (session + API key)
├── api.ts                    # Raspberry Pi API client
├── auth.ts                   # NextAuth configuration
├── db.ts                     # Prisma client singleton
├── queue.ts                  # QStash job queue (tournament automation)
├── realtime.ts               # SSE event emitters
├── redis.ts                  # Upstash Redis + rate limiters
├── pricing.ts                # Token costs for actions
├── kiosk-config.ts           # Arcade cabinet settings
├── camera-config.ts          # Camera streams and layouts
└── tournament.ts             # Tournament types, helpers, and prize tiers

prisma/
└── schema.prisma             # Database schema
```

### Key Patterns

#### Demo/Live Mode System

The app operates in two modes controlled by `ModeContext`:

```tsx
// lib/contexts/ModeContext.tsx
const { mode, setMode, isTokenRequired } = useGameMode();
// mode: 'demo' | 'live'
```

- **Demo mode**: Free simulation, no tokens required, all features unlocked
- **Live mode**: Real hardware control, token-gated actions, queue system

#### Hardware Abstraction

```tsx
// hooks/useHardwareAdapter.ts
const { state, actions } = useHardwareAdapter({ mode, onTokenBalanceChange });

// Actions work in both modes:
await actions.setTrainSpeed(trackId, speed);  // Demo: local state, Live: API call
await actions.toggleJunction(id);
await actions.emergencyStop();
```

#### Game Mode Engine

```tsx
// lib/game-modes/GameModeEngine.ts
const engine = createGameMode('SPEED_RUN');
engine.start();
engine.addScore('checkpoint', 'Checkpoint reached', 'train1');
const state = engine.getState(); // { score, timeRemaining, isActive, etc. }
```

#### Token Confirmation Flow

Live mode actions that cost tokens show a confirmation dialog:

```tsx
// components/TokenConfirmDialog.tsx
const { requestConfirmation, Dialog } = useTokenConfirmation(tokenBalance);
const confirmed = await requestConfirmation('TRAIN_START', 2);
```

### Component Architecture

#### Main Page (`app/page.tsx`)

- `RailroadArcade` component manages global state
- Tab-based navigation: Overview, Trains, Scenery, Buildings, Sensors, Camera, Streaming, Gallery, History
- Auto-starts in demo mode for seamless experience

#### LiveTrackLayout (`components/LiveTrackLayout.tsx`)

- SVG-based track visualization (700x450 viewBox)
- Real-time train animation with trails
- Interactive junctions and crossings (clickable, keyboard accessible)
- Telemetry panel with train stats
- Listens for global `railroad:emergencyStop` events

#### Kiosk Mode (`app/kiosk/page.tsx`)

- Full-screen arcade cabinet interface
- Large touch targets
- Token error messaging
- Attract screen with auto-timeout

### Database Schema (Prisma)

Key models in `prisma/schema.prisma`:

- `User` - tokenBalance, unlockedModules[], achievements
- `PlaySession` - gameMode, score, duration, events
- `Transaction` - token purchases and spending
- `Leaderboard` - high scores per gameMode + isLive flag
- `LiveQueue` - queue positions for live hardware access
- `Tournament` - tournament config, status, prizes (JSON), dates
- `TournamentEntry` - user registration, score, rank, attempts

### API Routes

#### Authentication
- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

#### User Data
- `GET /api/user` - Current user with tokens, modules
- `POST /api/user/modules` - Unlock module
- `GET /api/user/stats` - Play statistics
- `GET /api/user/sessions` - Session history

#### Game
- `GET /api/leaderboards?gameMode=X&isLive=Y` - Fetch leaderboards
- `POST /api/sessions` - Start/end play sessions

#### Payments
- `POST /api/payments/stripe` - Create Stripe checkout
- `POST /api/payments/paypal` - Create PayPal order
- `POST /api/payments/coinbase` - Create crypto charge

#### Tournaments
- `GET /api/tournaments` - List tournaments (filter by status, type)
- `POST /api/tournaments` - Create tournament (admin only)
- `GET /api/tournaments/[id]` - Get tournament details
- `POST /api/tournaments/[id]/register` - Register for tournament
- `POST /api/tournaments/[id]/submit` - Submit score
- `GET /api/tournaments/[id]/leaderboard` - Paginated leaderboard with user context

#### Admin
- `POST /api/admin/grant-tokens` - Grant tokens to user
- `PATCH /api/admin/tournaments/[id]` - Update tournament
- `DELETE /api/admin/tournaments/[id]` - Cancel tournament (refunds entry fees)
- `POST /api/admin/tournaments/[id]/finalize` - Force finalize active tournament

#### Queue Processing
- `POST /api/queue/process` - QStash webhook for job processing
  - `TOURNAMENT_STATUS_CHECK` - Transition tournament statuses
  - `TOURNAMENT_FINALIZE` - Calculate ranks, mark complete
  - `TOURNAMENT_DISTRIBUTE_PRIZES` - Award tokens and achievements

### Styling Conventions

- Tailwind CSS with custom dark theme
- CSS variables in `app/globals.css`
- Colors: cyan (`#00f0ff`), purple (`#a855f7`), amber for tokens
- Fonts: Orbitron (display), Inter (body), JetBrains Mono (code)
- Min touch targets: 44px height for accessibility
- Focus states: cyan outline with box-shadow

### Accessibility

Recent improvements include:
- ARIA labels on all icon buttons
- `aria-pressed` states for toggle buttons
- Keyboard navigation for SVG elements (junctions, crossings)
- Focus-visible styles with cyan outline
- Skeleton loading states for perceived performance
- Confirmation dialogs for destructive actions

## Common Tasks

### Adding a New Game Mode

1. Add mode to `GameMode` enum in `prisma/schema.prisma`
2. Add config in `lib/game-modes/GameModeEngine.ts`:
   ```tsx
   export const GAME_MODE_CONFIGS: Record<GameModeId, GameModeConfig> = {
     NEW_MODE: {
       id: 'NEW_MODE',
       name: 'New Mode',
       description: '...',
       tokenCost: 5,
       duration: 180,
       // ...
     }
   };
   ```
3. Update `GameModeSelector.tsx` if needed
4. Run `npx prisma db push`

### Adding a New Building Module

1. Create component in `components/`:
   ```tsx
   export function NewModule({ locked, onUnlock }: ModuleProps) {
     return (
       <ModulePanel title="New Module" locked={locked} onUnlock={onUnlock}>
         {/* Controls */}
       </ModulePanel>
     );
   }
   ```
2. Add to `app/page.tsx` modules array and Buildings tab
3. Add pricing in `lib/pricing.ts`

### Adding Hardware Control

1. Add method to `lib/hardware/HardwareAdapter.ts` interface
2. Implement in `DemoAdapter.ts` (simulation)
3. Implement in `LiveAdapter.ts` (API call)
4. Add token cost in `lib/pricing.ts` if applicable

### Creating a Tournament

1. Navigate to `/admin/tournaments` (requires admin access)
2. Click "Create Tournament" and fill in:
   - Name, description, type (Daily/Weekly/Special/Championship)
   - Game mode (Speed Run, Delivery Mission, etc.)
   - Registration and tournament dates
   - Entry fee, max participants, min level requirement
   - Prize pool and distribution
3. Tournament will automatically transition through statuses via QStash

### Tournament Lifecycle

```
SCHEDULED → REGISTRATION → ACTIVE → COMPLETED
    │            │           │          │
    └── registrationStart    │          │
                 └── startTime          │
                             └── endTime (auto-finalize)
```

- **SCHEDULED**: Tournament visible but registration not open
- **REGISTRATION**: Players can register (tokens deducted)
- **ACTIVE**: Players can submit scores (best score kept)
- **COMPLETED**: Ranks calculated, prizes distributed

### Admin Authentication

Two methods supported in `lib/admin.ts`:

1. **Session-based**: User must be in `ADMIN_USER_IDS` or `ADMIN_EMAILS` env vars
2. **API key**: Include `x-admin-key` header matching `ADMIN_KEY` env var

```typescript
// In API route
import { checkAdminAccess } from '@/lib/admin';

const adminId = await checkAdminAccess(request);
if (!adminId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

## Environment Variables

Required:
```
DATABASE_URL          # Neon PostgreSQL connection string
NEXTAUTH_URL          # App URL (http://localhost:3000 for dev)
NEXTAUTH_SECRET       # Random secret for NextAuth
```

Optional:
```
UPSTASH_REDIS_REST_URL    # Redis for caching/rate limiting
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_API_URL       # Raspberry Pi API (for live mode)
STRIPE_SECRET_KEY         # Payment providers
PAYPAL_CLIENT_ID
COINBASE_COMMERCE_API_KEY
STORAGE_URL               # Cloud storage URL for recordings/snapshots

# Admin Configuration
ADMIN_KEY                 # API key for admin endpoints
ADMIN_USER_IDS            # Comma-separated list of admin user IDs
ADMIN_EMAILS              # Comma-separated list of admin emails

# QStash (for tournament automation)
QSTASH_URL                # https://qstash.upstash.io
QSTASH_TOKEN              # QStash API token
QSTASH_CURRENT_SIGNING_KEY
QSTASH_NEXT_SIGNING_KEY
```

## Next Steps / Roadmap

### High Priority
1. ~~**Real Camera Integration**~~ - ✅ MJPEG stream support added with auto-retry
2. ~~**WebSocket Real-time Updates**~~ - ✅ SSE events for queue and session updates
3. ~~**Recording System**~~ - ✅ Snapshot gallery with full API integration
4. **Queue System Testing** - Full testing of live mode queue with multiple users

### Medium Priority
5. ~~**Multi-camera Grid**~~ - ✅ PiP, grid layouts, camera swap functionality
6. ~~**Achievement System**~~ - ✅ Notifications, sounds, and badge count
7. ~~**Social Features**~~ - ✅ Share scores on leaderboards and snapshots
8. ~~**Sound Effects**~~ - ✅ 17 synthesized arcade sounds

### Low Priority / Nice-to-Have
9. **Mobile App** - React Native version for mobile control
10. **Replay System** - Record and replay train sessions
11. **Custom Track Layouts** - Allow users to design track configurations
12. ~~**Tournament Mode**~~ - ✅ Full API with automation, prizes, and admin UI

### Technical Debt
- Replace `<img>` with Next.js `<Image />` for optimization
- Add comprehensive test coverage
- Implement proper error boundaries
- Add request/response logging for debugging

## Recent Changes (December 2025)

### Capacitor Mobile Integration (v1.2.0+)
- **Native App Support**: iOS and Android platforms via Capacitor
- **Haptic Feedback**: Integrated with sound system - all sounds trigger matching haptics
- **Native Share**: Uses platform share sheet on mobile devices
- **App Lifecycle**: Handles background/foreground transitions
- **Server-Loaded**: Mobile apps load from hosted Vercel URL

### Safe-Area Support
- **Viewport**: Added `viewportFit: cover` for notched devices
- **CSS Utilities**: `--safe-top/bottom/left/right` custom properties
- **Sticky Headers**: `sticky-header` and `sticky-tabs` classes with safe-area awareness
- **Dynamic Heights**: `--header-height-mobile/tablet/desktop` variables

### Admin Security Improvements
- **Session-Based Auth**: Admin key now entered at runtime, stored in `sessionStorage`
- **No Public Exposure**: Removed `NEXT_PUBLIC_ADMIN_KEY` - key never bundled in client
- **Login UI**: Admin pages show authentication prompt
- **Sign Out**: Clear session button to revoke access

### API Performance
- **N+1 Query Fixed**: Tournament list now uses batch query for user entries
- **Map Lookup**: O(1) lookup for user registration status

### Security Fixes
- **Admin Endpoint Secured**: Removed hardcoded dev-testing key from `/api/admin/grant-tokens`. Now requires `ADMIN_KEY` environment variable.

### Code Quality Improvements
- **Type Safety**: Fixed `any` type casts in API routes:
  - `/api/recordings` - Uses proper Prisma types for query filters
  - `/api/leaderboards` - Validates `GameMode` enum before database queries
  - `/api/games` - Uses `Prisma.GameSessionWhereInput` for type-safe queries
- **Storage Deletion**: Added proper storage cleanup when deleting recordings (ready for S3 integration)

### Camera System Improvements
- **Stream Type Support**: Added `StreamType` enum supporting `mjpeg`, `hls`, `webrtc`, and `placeholder`
- **Live Stream Integration**: `CameraFeed` component now supports real MJPEG streams from Raspberry Pi
- **Auto-Retry Logic**: Camera feeds automatically retry connection on failure (up to 3 attempts)
- **Demo Mode Detection**: Cameras show placeholder UI when `NEXT_PUBLIC_API_URL` is not configured
- **Stream Info API**: New `getStreamInfo()` helper returns URL, type, and placeholder status

### Real-Time Updates
- **Queue Events**: Queue state changes now emit real-time SSE events to all connected clients
- **Session Events**: Session start, extend, and end events are broadcast to subscribers
- **Event Types**: `queue_update` and `session_update` events with position, wait time, and remaining time data

### Achievement System Improvements
- **Achievement Notifier**: Global component shows toast notifications when achievements unlock
- **Sound Integration**: Plays achievement sound effect on unlock
- **User Menu Badge**: Shows earned achievement count in the user dropdown menu
- **Real-Time Updates**: Achievement unlocks propagate via SSE to show instant notifications

### Sound Effects
- **Token Spending**: Added coin sound when confirming token purchases
- **16 Sound Types**: Full set including click, success, error, train sounds, junction, crossing, achievements, and more

### Social Features
- **Score Sharing**: Share button on leaderboard entries
- **Web Share API**: Uses native share on mobile, clipboard fallback on desktop
- **Formatted Share Text**: Includes player name, score, game mode, and link

### Snapshot Gallery
- **Full API Integration**: `/api/snapshots` endpoint with GET, POST, PATCH, DELETE operations
- **useSnapshots Hook**: Data fetching hook with optimistic updates for better UX
- **Real-Time Features**: Capture, like/unlike, download, and share snapshots
- **Filter Support**: Filter by all, liked, level 1, or level 2
- **Camera Sound**: New camera shutter sound effect on capture

### Keyboard Shortcuts
- **Comprehensive Help Modal**: Shows all train, track, camera, and game controls
- **Multi-Column Layout**: Organized by control category
- **Train Controls**: WASD for Train 1, Arrow keys for Train 2
- **Track Controls**: Number keys for junctions, C for crossing, Space for emergency stop
- **Toggle with ?**: Press ? anywhere to show/hide shortcuts help

### Session History
- **Full API Integration**: `/api/sessions` endpoint with pagination
- **useSessionHistory Hook**: Data fetching with cursor-based pagination
- **Three View Modes**: Sessions list, timeline view, and statistics
- **Event Tracking**: Records train starts, junction switches, achievements, and more
- **Expandable Sessions**: Click to see detailed event log and trains operated

### Multi-Camera Grid
- **Layout Options**: Single, dual horizontal/vertical, quad grid, picture-in-picture
- **Preset Views**: Quick switch between overview, stations, action, and all cameras
- **Camera Swapping**: Click swap button, then click another camera to swap positions
- **PiP Swap**: Quick swap main and overlay cameras in picture-in-picture mode
- **Change Camera**: Select any available camera for each slot
- **Snapshot Support**: Take snapshots from any camera in the grid

### Tournament System (Full API)
- **Tournament Types**: Daily, Weekly, Special, and Championship events
- **Status Tracking**: Scheduled, Registration, Active, Completed, Cancelled
- **Registration Flow**: Entry fee, participant limits, level-based validation
- **Prize System**: Configurable prize tiers with tokens, badges, and titles
- **Countdown Timer**: Real-time countdown to tournament start/end
- **Leaderboard Endpoint**: Paginated results with Redis caching and user context
- **useTournament Hook**: Real API integration with SSE subscription for live updates
- **TournamentBanner Component**: Expandable banner for displaying tournament info

### Tournament Automation (QStash)
- **Status Transitions**: Automatic SCHEDULED → REGISTRATION → ACTIVE → COMPLETED
- **Finalization Handler**: Calculates final ranks in batch transaction
- **Prize Distribution**: Awards tokens, creates transaction records, grants achievements
- **Achievement Types**: TOURNAMENT_CHAMPION, TOURNAMENT_SILVER, TOURNAMENT_BRONZE

### Admin Tournament Management
- **Admin UI**: `/admin/tournaments` page for full tournament lifecycle management
- **Create Tournaments**: Form with type, game mode, dates, prizes, participant limits
- **Edit Tournaments**: Update name, description, dates, prize pool
- **Cancel Tournaments**: Automatic refund of entry fees to all participants
- **Force Finalize**: End active tournaments early with immediate rank calculation
- **Admin Auth**: Supports both session-based and API key authentication

## Troubleshooting

### Build Errors
- Run `npx prisma generate` before `npm run build`
- Check DATABASE_URL is set correctly
- API routes using `headers()` will show errors during static generation (expected)

### Database Issues
- Use `npx prisma studio` to inspect data
- Reset with `npx prisma db push --force-reset` (WARNING: deletes data)

### Live Mode Not Working
- Verify NEXT_PUBLIC_API_URL points to Raspberry Pi
- Check Pi server is running and accessible
- Verify network connectivity between frontend and Pi

## Known Issues

See `KNOWN_ISSUES.md` for a comprehensive list of bugs and technical debt.

### Critical Issues (Require Immediate Attention)
1. **Race condition in tournament registration** - Concurrent registrations can exceed max participants
2. **No idempotency in prize distribution** - QStash retries can award duplicate prizes
3. **Race condition in status transitions** - Concurrent status checks can cause duplicate jobs

### Key Technical Debt
- Tournament ranking doesn't handle tied scores properly
- SSE connections lack reconnection logic
- N+1 query problem in tournament listing
- Console statements should be replaced with proper logger
- Email and thumbnail handlers are stub implementations

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| v1.1.0 | Dec 2025 | Full Tournament API with automation and admin UI |
| v1.0.0 | Dec 2025 | Initial release with core features |
