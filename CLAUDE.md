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
│   ├── auth/                 # NextAuth endpoints
│   ├── payments/             # Stripe, PayPal, Coinbase
│   ├── leaderboards/         # Game leaderboards
│   ├── queue/                # Live mode queue system
│   └── user/                 # User data (stats, sessions, transactions)
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
└── TokenConfirmDialog.tsx    # Token spending confirmation

hooks/
├── useUser.ts                # User state, tokens, modules
├── useLeaderboard.ts         # Leaderboard data fetching
├── useHardwareAdapter.ts     # Hardware abstraction layer
└── useArcadeInput.ts         # Keyboard/gamepad input

lib/
├── contexts/ModeContext.tsx  # Demo/Live mode context
├── game-modes/               # Game mode engines
│   └── GameModeEngine.ts     # Base engine + mode configs
├── hardware/                 # Hardware adapters
│   ├── HardwareAdapter.ts    # Interface definition
│   ├── DemoAdapter.ts        # Simulation adapter
│   └── LiveAdapter.ts        # Real hardware adapter
├── api.ts                    # Raspberry Pi API client
├── auth.ts                   # NextAuth configuration
├── db.ts                     # Prisma client singleton
├── redis.ts                  # Upstash Redis + rate limiters
├── pricing.ts                # Token costs for actions
└── kiosk-config.ts           # Arcade cabinet settings

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
ADMIN_KEY                 # Required for admin endpoints (token grants)
STORAGE_URL               # Cloud storage URL for recordings/snapshots
```

## Next Steps / Roadmap

### High Priority
1. **Real Camera Integration** - Replace placeholder camera feeds with actual Raspberry Pi camera streams
2. **WebSocket Real-time Updates** - Replace polling with WebSocket for train positions, queue status
3. **Recording System** - Implement actual video recording and snapshot saving
4. **Queue System Testing** - Full testing of live mode queue with multiple users

### Medium Priority
5. **Multi-camera Grid** - Implement PiP and split-view layouts for multiple cameras
6. **Achievement System** - Implement achievement unlocking and display
7. **Social Features** - Share scores, challenge friends
8. **Sound Effects** - Add arcade-style audio feedback

### Low Priority / Nice-to-Have
9. **Mobile App** - React Native version for mobile control
10. **Replay System** - Record and replay train sessions
11. **Custom Track Layouts** - Allow users to design track configurations
12. **Tournament Mode** - Scheduled competitive events

### Technical Debt
- Replace `<img>` with Next.js `<Image />` for optimization
- Add comprehensive test coverage
- Implement proper error boundaries
- Add request/response logging for debugging

## Recent Changes (December 2025)

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
