# Railroad Arcade

An interactive web application for controlling a 2-level HO scale model railroad with dual-mode operation (Demo/Live), token-based access, real-time train tracking, game modes, and comprehensive scenery control.

**Live Demo:** https://railroad-arcade-v5.vercel.app

**Version:** 1.0.0 | **Released:** December 2025

## Features

### Dual-Mode Operation
- **Demo Mode** - Full simulation free for all users, no hardware required
- **Live Mode** - Real Raspberry Pi hardware control with token-based access

### Interactive Control System
- **Real-time Train Tracking** - Live SVG visualization with 3 trains across 2 levels
- **Junction & Crossing Control** - Toggle junctions and railroad crossings
- **Autopilot Mode** - Automated train operation with station stops
- **Emergency Stop** - Global emergency stop with confirmation

### Game Modes
- **Free Play** - Sandbox mode for exploration
- **Speed Run** - Complete circuits as fast as possible
- **Delivery Mission** - Transport cargo between stations
- **Survival** - Avoid collisions and obstacles
- **Time Attack** - Score points within time limit

### Scenery Control
- **Time of Day** - Dawn, Day, Sunset, Night with ambient lighting
- **Lighting Zones** - 11+ controllable zones
- **Water Features** - Waterfalls, lakes, fountains with speed control
- **Animated Elements** - Windmill, smokestacks, boats

### Building Modules
- Police Station, Fire Station, Cafe, Smart Home, Construction Zone, Diamond Crossing

### Multi-Camera & Recording
- **Multi-Camera Grid** - Single, dual, quad, and picture-in-picture layouts
- **Snapshot Gallery** - Capture, like, download, and share snapshots
- **Camera Presets** - Overview, stations, action, and all-camera views
- **MJPEG Streaming** - Real-time camera feeds with auto-retry

### Social & Progression
- **Achievements** - 10 unlockable achievements with toast notifications
- **Leaderboards** - High scores by game mode with social sharing
- **Session History** - Timeline view with stats and event tracking
- **Tournament Mode** - Daily, weekly, and special tournament events

### Additional Features
- **Kiosk Mode** - Full-screen arcade cabinet support
- **Token System** - Stripe, PayPal, and crypto payments
- **Sound Effects** - 17 synthesized arcade sounds
- **Keyboard Shortcuts** - Full keyboard/gamepad support with help modal
- **Real-Time Updates** - SSE events for queue and session state

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Auth:** NextAuth.js v4
- **Styling:** Tailwind CSS
- **Caching:** Upstash Redis
- **Payments:** Stripe, PayPal, Coinbase Commerce
- **Deployment:** Vercel

## Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Raspberry Pi API (optional, for live mode)
NEXT_PUBLIC_API_URL="http://raspberry-pi-ip:5000"

# Payments (optional)
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
COINBASE_COMMERCE_API_KEY="..."
COINBASE_WEBHOOK_SECRET="..."

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."
```

## Installation

```bash
# Clone the repository
git clone https://github.com/punitmishra/railroad-arcade.git
cd railroad-arcade

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema (creates tables)
npx prisma db push

# Start development server
npm run dev
```

Open http://localhost:3000 to view the application.

## Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Database Commands

```bash
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma studio        # Open Prisma Studio GUI
npx prisma migrate dev   # Create migration (development)
npx prisma migrate deploy # Apply migrations (production)
```

## Deployment (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
# Deploy to production
vercel --prod
```

## Project Structure

```
railroad-arcade/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # NextAuth endpoints
│   │   ├── payments/           # Stripe, PayPal, Coinbase
│   │   ├── leaderboards/       # Game leaderboards
│   │   ├── queue/              # Live queue system
│   │   └── user/               # User data endpoints
│   ├── kiosk/                  # Arcade cabinet mode
│   ├── leaderboards/           # Leaderboards page
│   ├── settings/               # User settings
│   ├── profile/                # User profile
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main arcade page
├── components/
│   ├── auth/                   # Auth components
│   ├── kiosk/                  # Kiosk-specific components
│   ├── icons.tsx               # 60+ custom SVG icons
│   ├── ui.tsx                  # Core UI components
│   ├── LiveTrackLayout.tsx     # Real-time track visualization
│   ├── SceneryControl.tsx      # Scenery control panel
│   ├── GameModeSelector.tsx    # Game mode selection
│   ├── GameHUD.tsx             # In-game HUD
│   ├── MultiCameraGrid.tsx     # Multi-view camera layouts
│   ├── SnapshotGallery.tsx     # Photo gallery with filters
│   ├── SessionHistory.tsx      # Session log with timeline
│   ├── TournamentBanner.tsx    # Tournament display
│   └── ...                     # Other modules
├── hooks/
│   ├── useUser.ts              # User state management
│   ├── useLeaderboard.ts       # Leaderboard data
│   ├── useHardwareAdapter.ts   # Hardware abstraction
│   ├── useArcadeInput.ts       # Arcade input handling
│   ├── useSnapshots.ts         # Snapshot gallery data
│   ├── useSessionHistory.ts    # Session history with pagination
│   ├── useTournament.ts        # Tournament data and actions
│   └── useSounds.tsx           # Synthesized arcade sounds
├── lib/
│   ├── contexts/               # React contexts
│   │   └── ModeContext.tsx     # Demo/Live mode
│   ├── game-modes/             # Game mode engines
│   ├── hardware/               # Hardware adapters
│   ├── api.ts                  # Raspberry Pi API client
│   ├── auth.ts                 # NextAuth config
│   ├── db.ts                   # Prisma client
│   ├── redis.ts                # Redis/cache utilities
│   └── pricing.ts              # Token pricing
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
├── CLAUDE.md                   # AI assistant guide
└── README.md                   # This file
```

## API Integration (Raspberry Pi)

For live hardware control, the app connects to a Raspberry Pi running a control server:

```env
NEXT_PUBLIC_API_URL=http://raspberry-pi-ip:5000
```

### Hardware API Endpoints
- `GET /api/status` - System status
- `POST /api/emergency-stop` - Emergency stop all trains
- `POST /api/tracks/:id/speed` - Set track speed
- `POST /api/cpx/gate/:position` - Control crossing gates
- `POST /api/scenery` - Update scenery state

## Design System

### Colors
- **Neon Cyan:** `#00f0ff` - Primary accent
- **Neon Purple:** `#a855f7` - Secondary accent
- **Token Gold:** `#ffd700` - Currency/rewards
- **Background:** `#0a0a0f` - Dark base

### Typography
- **Display:** Orbitron (headers)
- **Body:** Space Grotesk / Inter
- **Mono:** JetBrains Mono

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Run `npm run build` to verify
5. Submit a pull request

## License

MIT License - feel free to use and modify for your own projects.
