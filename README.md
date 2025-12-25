<p align="center">
  <img src="public/icons/icon-512x512.png" alt="Railroad Arcade" width="120" height="120">
</p>

<h1 align="center">Railroad Arcade</h1>

<p align="center">
  <strong>Control a real 2-level HO scale model railroad from anywhere in the world</strong>
</p>

<p align="center">
  <a href="https://railroad-arcade-v5.vercel.app">
    <img src="https://img.shields.io/badge/demo-live-00f0ff?style=for-the-badge" alt="Live Demo">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-a855f7?style=for-the-badge" alt="MIT License">
  </a>
  <img src="https://img.shields.io/badge/version-1.2.0-ffd700?style=for-the-badge" alt="Version 1.2.0">
  <img src="https://img.shields.io/badge/next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js 14">
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#api">API</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## What is Railroad Arcade?

Railroad Arcade is an interactive web and mobile application that lets you control a real model railroad remotely. Play in **Demo Mode** for free simulation, or switch to **Live Mode** to control actual hardware via a Raspberry Pi. Compete in tournaments, unlock achievements, and climb the leaderboards!

### Download

<p align="center">
  <a href="#">
    <img src="https://img.shields.io/badge/App_Store-Coming_Soon-000000?style=for-the-badge&logo=apple" alt="App Store">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Google_Play-Coming_Soon-414141?style=for-the-badge&logo=google-play" alt="Google Play">
  </a>
  <a href="https://railroad-arcade-v5.vercel.app">
    <img src="https://img.shields.io/badge/Web_App-Play_Now-00f0ff?style=for-the-badge&logo=pwa" alt="Web App">
  </a>
</p>

---

## Features

### Train Control
- **Real-time Visualization** — Live SVG track with 3 animated trains across 2 levels
- **Junction & Crossing Control** — Toggle switches and railroad crossings
- **Autopilot Mode** — Automated train operation with station stops
- **Emergency Stop** — Global safety stop with confirmation

### Game Modes
| Mode | Description | Token Cost |
|------|-------------|------------|
| Free Play | Sandbox exploration | 2 |
| Speed Run | Complete circuits fast | 5 |
| Delivery Mission | Transport cargo | 5 |
| Survival | Avoid collisions | 5 |
| Time Attack | Score in time limit | 5 |

### Scenery & Buildings
- **Time of Day** — Dawn, Day, Sunset, Night with ambient lighting
- **11+ Lighting Zones** — Individual control for realistic scenes
- **Water Features** — Waterfalls, lakes, fountains
- **Animated Elements** — Windmill, smokestacks, boats
- **Unlockable Modules** — Police, Fire Station, Cafe, Smart Home, and more

### Multi-Camera System
- **Layout Options** — Single, dual, quad, and picture-in-picture
- **Snapshot Gallery** — Capture, like, download, and share
- **MJPEG Streaming** — Real-time feeds with auto-retry
- **Camera Presets** — Overview, stations, action views

### Progression & Social
- **10 Achievements** — Unlock badges with toast notifications
- **Leaderboards** — Global rankings by game mode
- **Session History** — Timeline view with detailed stats
- **Tournament System** — Daily, weekly, and championship events
- **Social Sharing** — Share scores and snapshots

### Platform Features
- **PWA Support** — Install as app on any device
- **Kiosk Mode** — Full-screen arcade cabinet support
- **17 Sound Effects** — Synthesized arcade audio
- **Keyboard & Gamepad** — Full control support
- **Real-time Updates** — SSE for live queue and session state

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/punitmishra/railroad-arcade.git
cd railroad-arcade
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database and API keys
```

### 3. Run

```bash
npx prisma db push    # Create database tables
npm run dev           # Start at localhost:3000
```

**That's it!** Open http://localhost:3000 and start playing in Demo Mode.

---

## Tech Stack

<table>
  <tr>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=nextjs" width="48" height="48" alt="Next.js" />
      <br>Next.js 14
    </td>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=ts" width="48" height="48" alt="TypeScript" />
      <br>TypeScript
    </td>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
      <br>Tailwind
    </td>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=prisma" width="48" height="48" alt="Prisma" />
      <br>Prisma
    </td>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=postgres" width="48" height="48" alt="PostgreSQL" />
      <br>PostgreSQL
    </td>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=redis" width="48" height="48" alt="Redis" />
      <br>Redis
    </td>
  </tr>
</table>

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Neon) + Prisma ORM |
| **Auth** | NextAuth.js v4 (JWT) |
| **Styling** | Tailwind CSS |
| **Caching** | Upstash Redis |
| **Queue** | QStash (scheduled jobs) |
| **Payments** | Stripe, PayPal, Coinbase Commerce |
| **Real-time** | Server-Sent Events (SSE) |
| **PWA** | next-pwa with Service Worker |
| **Deployment** | Vercel |

---

## Screenshots

<table>
  <tr>
    <td align="center"><b>Main Control Panel</b></td>
    <td align="center"><b>Game Mode Selection</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/control-panel.png" alt="Control Panel" width="400"></td>
    <td><img src="docs/screenshots/game-modes.png" alt="Game Modes" width="400"></td>
  </tr>
  <tr>
    <td align="center"><b>Multi-Camera View</b></td>
    <td align="center"><b>Leaderboards</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/multi-camera.png" alt="Multi-Camera" width="400"></td>
    <td><img src="docs/screenshots/leaderboards.png" alt="Leaderboards" width="400"></td>
  </tr>
</table>

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Required
DATABASE_URL="postgresql://..."      # Neon PostgreSQL
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32"

# Caching & Queue
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Hardware (for Live Mode)
NEXT_PUBLIC_API_URL="http://raspberry-pi:5000"

# Payments (optional)
STRIPE_SECRET_KEY="sk_..."
PAYPAL_CLIENT_ID="..."
COINBASE_COMMERCE_API_KEY="..."
```

See [.env.example](.env.example) for all options.

---

## API

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leaderboards` | GET | Fetch high scores |
| `/api/tournaments` | GET | List tournaments |
| `/api/tournaments/[id]/leaderboard` | GET | Tournament rankings |

### Authenticated Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user` | GET | Current user data |
| `/api/user/modules` | POST | Unlock module |
| `/api/sessions` | POST | Start/end session |
| `/api/tournaments/[id]/register` | POST | Join tournament |
| `/api/tournaments/[id]/submit` | POST | Submit score |

### Hardware API (Raspberry Pi)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | System status |
| `/api/emergency-stop` | POST | Stop all trains |
| `/api/tracks/:id/speed` | POST | Set train speed |
| `/api/cpx/gate/:position` | POST | Control crossings |

Full API documentation: [docs/API.md](docs/API.md)

---

## Project Structure

```
railroad-arcade/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth
│   │   ├── payments/       # Stripe, PayPal, Coinbase
│   │   ├── tournaments/    # Tournament system
│   │   └── user/           # User endpoints
│   ├── kiosk/              # Arcade cabinet mode
│   └── page.tsx            # Main app
├── components/             # React components
│   ├── LiveTrackLayout.tsx # Track visualization
│   ├── GameModeSelector.tsx
│   ├── MultiCameraGrid.tsx
│   └── TournamentBanner.tsx
├── hooks/                  # React hooks
│   ├── useHardwareAdapter.ts
│   ├── useTournament.ts
│   └── useSounds.tsx
├── lib/                    # Utilities
│   ├── hardware/           # Demo/Live adapters
│   ├── game-modes/         # Game engines
│   ├── auth.ts             # NextAuth config
│   └── db.ts               # Prisma client
└── prisma/
    └── schema.prisma       # Database schema
```

---

## Development

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run test         # Jest tests
```

### Database

```bash
npx prisma generate  # Generate client
npx prisma db push   # Push schema
npx prisma studio    # GUI browser
npx prisma migrate dev  # Create migration
```

### Mobile (Capacitor)

```bash
npm run build:mobile  # Build for mobile
npm run ios          # Open Xcode
npm run android      # Open Android Studio
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t railroad-arcade .
docker run -p 3000:3000 --env-file .env railroad-arcade
```

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## Security

Found a vulnerability? Please see [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

---

## License

[MIT License](LICENSE) — feel free to use and modify for your own projects.

---

## Acknowledgments

- Train icons by [Lucide](https://lucide.dev)
- Fonts: Orbitron, Space Grotesk, JetBrains Mono
- Deployed on [Vercel](https://vercel.com)

---

<p align="center">
  Made with <span style="color: #00f0ff;">♥</span> for model railroad enthusiasts
</p>

<p align="center">
  <a href="https://railroad-arcade-v5.vercel.app">Play Now</a> •
  <a href="https://github.com/punitmishra/railroad-arcade/issues">Report Bug</a> •
  <a href="https://github.com/punitmishra/railroad-arcade/discussions">Discussions</a>
</p>
