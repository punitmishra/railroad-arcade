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
  <img src="https://img.shields.io/badge/version-1.4.1-ffd700?style=for-the-badge" alt="Version 1.4.1">
  <img src="https://img.shields.io/badge/next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js 14">
  <img src="https://img.shields.io/badge/rust-backend-orange?style=for-the-badge&logo=rust" alt="Rust Backend">
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#hardware-backend">Hardware Backend</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## What is Railroad Arcade?

Railroad Arcade is a full-stack IoT application that lets you control a real HO scale model railroad remotely. The system combines a **Next.js 14 frontend** deployed on Vercel with a **Rust-based backend** running on a Raspberry Pi that controls the physical hardware.

**Play in Demo Mode** for free simulation, or switch to **Live Mode** to control actual trains, junctions, crossings, and scenery via the internet.

### Live Demo & Downloads

<p align="center">
  <a href="https://railroad-arcade-v5.vercel.app">
    <img src="https://img.shields.io/badge/Web_App-Play_Now-00f0ff?style=for-the-badge&logo=pwa" alt="Web App">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/App_Store-Coming_Soon-000000?style=for-the-badge&logo=apple" alt="App Store">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Google_Play-Coming_Soon-414141?style=for-the-badge&logo=google-play" alt="Google Play">
  </a>
</p>

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLOUD (Vercel)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Next.js 14    │  │   PostgreSQL    │  │      Upstash Redis          │  │
│  │   Frontend      │  │   (Neon)        │  │   + QStash Queue            │  │
│  │   + API Routes  │  │                 │  │                             │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘  │
│           │                    │                          │                  │
│           │  Prisma ORM        │    Cache + Jobs          │                  │
│           └────────────────────┴──────────────────────────┘                  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ HTTPS (Live Mode)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RASPBERRY PI (On-Premise)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Rust Backend (Actix-web)                          │    │
│  │                    Port 5000 - REST API                              │    │
│  └───────────┬─────────────────┬─────────────────┬─────────────────────┘    │
│              │                 │                 │                          │
│              ▼                 ▼                 ▼                          │
│  ┌───────────────┐  ┌──────────────────┐  ┌──────────────────┐              │
│  │  PWM Drivers  │  │ Circuit Playground│  │   USB Camera     │              │
│  │  (3 Tracks)   │  │ Express (CPX)     │  │  MJPEG Stream    │              │
│  │              │  │  - 4 Servos       │  │  Port 8080       │              │
│  │              │  │  - Gate Control   │  │                  │              │
│  │              │  │  - LEDs/Sound     │  │                  │              │
│  └───────┬──────┘  └────────┬─────────┘  └────────┬─────────┘              │
│          │                  │                     │                         │
└──────────┼──────────────────┼─────────────────────┼─────────────────────────┘
           │                  │                     │
           ▼                  ▼                     ▼
    ┌──────────────────────────────────────────────────────┐
    │              HO SCALE MODEL RAILROAD                  │
    │  • 3 Trains (Level 1 & 2)    • 3 Junctions           │
    │  • 3 Crossings               • 6 Signals             │
    │  • Distance Sensors (HC-SR04) • Scenery Lighting     │
    └──────────────────────────────────────────────────────┘
```

### Repository Structure

| Repository | Description | Stack |
|------------|-------------|-------|
| [railroad-arcade](https://github.com/punitmishra/railroad-arcade) | Frontend + Cloud APIs | Next.js, TypeScript, Prisma |
| [pi-railroad-controller](https://github.com/punitmishra/pi-railroad-controller) | Raspberry Pi Backend | Rust, Actix-web |

---

## Features

### Train Control
- **Real-time Visualization** — Live SVG track with 3 animated trains across 2 levels
- **Speed & Direction** — 0-100% speed control with forward/reverse
- **Junction & Crossing Control** — Toggle switches and railroad crossings
- **Autopilot Mode** — Automated train operation with station stops
- **Emergency Stop** — Global safety stop across all trains

### Game Modes
| Mode | Description | Token Cost |
|------|-------------|------------|
| Free Play | Sandbox exploration | 2 |
| Speed Run | Complete circuits fast | 5 |
| Delivery Mission | Transport cargo | 5 |
| Survival | Avoid collisions | 5 |
| Time Attack | Score in time limit | 5 |

### Hardware Control (Live Mode)
- **PWM Motor Control** — Precise speed control for 3 train tracks
- **Servo Junctions** — 4 servo-controlled track switches via CPX
- **Crossing Gates** — Automated gate up/down with position sensing
- **Distance Sensors** — HC-SR04 ultrasonic sensors for train detection
- **LED Signals** — Red/Yellow/Green signal states based on proximity
- **Scenery Lighting** — 7 independent lighting zones

### Multi-Camera System
- **Layout Options** — Single, dual, quad, and picture-in-picture
- **MJPEG Streaming** — Real-time video with auto-retry
- **Snapshot Gallery** — Capture, like, download, and share
- **Camera Presets** — Overview, stations, action views

### Progression & Social
- **10 Achievements** — Unlock badges with toast notifications
- **Leaderboards** — Global rankings by game mode (Demo & Live)
- **Session History** — Timeline view with detailed stats
- **Tournament System** — Daily, weekly, and championship events
- **Social Sharing** — Share scores and snapshots via Web Share API

### Platform Features
- **PWA Support** — Install as app on any device
- **Kiosk Mode** — Full-screen arcade cabinet support
- **17 Sound Effects** — Synthesized arcade audio with haptic feedback
- **Keyboard & Gamepad** — Full control support
- **Mobile Optimized** — Capacitor-ready for iOS/Android

### New in v1.4.1: Queue & Session Management
- **Hardware Health Check** — Real-time Pi status with latency monitoring
- **Session Lifecycle** — Heartbeat keep-alive with 60s timeout
- **Real-time SSE** — Live hardware state from Rust backend (tracks, sensors, camera)
- **Session Recording** — Record and playback with speed control (0.25x-4x)
- **Spectator Mode** — Watch live sessions without joining queue
- **Priority Queue** — Skip ahead with Priority (2x), Express (3x), or VIP (5x) tokens

---

## Quick Start

### Frontend (Next.js)

```bash
# Clone and install
git clone https://github.com/punitmishra/railroad-arcade.git
cd railroad-arcade
npm install

# Configure environment
cp .env.example .env
```

#### Required Environment Variables

```bash
# Database (PostgreSQL - recommend Neon for free tier)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Auth (generate secret with: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"

# Redis (Upstash - free tier available)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

#### Optional Environment Variables

```bash
# Raspberry Pi Hardware (for Live Mode)
NEXT_PUBLIC_API_URL="http://raspberry-pi-ip:5000"

# Background Jobs (QStash)
QSTASH_TOKEN="your-qstash-token"
QSTASH_CURRENT_SIGNING_KEY="..."
QSTASH_NEXT_SIGNING_KEY="..."

# Payments
STRIPE_SECRET_KEY="sk_..."
PAYPAL_CLIENT_ID="..."
COINBASE_COMMERCE_API_KEY="..."

# Admin Access
ADMIN_KEY="your-admin-api-key"
ADMIN_USER_IDS="user-id-1,user-id-2"
ADMIN_EMAILS="admin@example.com"
```

#### Database Setup & Run

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
npm run dev

# Run tests (298 tests)
npm test
```

Open http://localhost:3000 — Demo Mode works immediately!

### Backend (Rust on Raspberry Pi)

```bash
# On Raspberry Pi
git clone https://github.com/punitmishra/pi-railroad-controller.git
cd pi-railroad-controller

# Build and run
cargo build --release
./target/release/pi-railroad-controller
```

The backend runs on port 5000 (API) and port 8080 (camera stream).

---

## Hardware Backend

### Rust API Server

The Raspberry Pi runs a Rust backend built with Actix-web that provides:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | System status, track states, distances |
| `/api/tracks` | GET | All track states (speed, direction, running) |
| `/api/tracks/:id/speed` | POST | Set track speed (0-100) |
| `/api/tracks/:id/forward` | POST | Set forward direction |
| `/api/tracks/:id/reverse` | POST | Set reverse direction |
| `/api/tracks/:id/stop` | POST | Stop track |
| `/api/emergency-stop` | POST | Emergency stop all tracks |
| `/api/cpx/status` | GET | CPX status (servos, gate, temp) |
| `/api/cpx/servo/:num/:angle` | POST | Set servo angle |
| `/api/cpx/gate/:position` | POST | Set gate up/down |
| `/api/cpx/led/:color` | POST | Set CPX LED color |
| `/api/cpx/sound/:name` | POST | Play sound on CPX |
| `/api/camera/start` | POST | Start camera stream |
| `/api/camera/stop` | POST | Stop camera stream |
| `/api/camera/status` | GET | Camera status |
| `/api/distances` | GET | HC-SR04 sensor readings |
| `/api/scenery` | GET/POST | Scenery state (time, lighting) |
| `/api/schedules` | GET/POST/DELETE | Automation schedules |
| `/api/sequences` | GET | Available automation sequences |
| `/api/sequences/:id/run` | POST | Execute automation sequence |

### Hardware Components

| Component | Model | Purpose |
|-----------|-------|---------|
| SBC | Raspberry Pi 4 | Main controller |
| Motor Driver | PCA9685 PWM | 3-channel train speed control |
| Servo Controller | Circuit Playground Express | 4 junction servos + gate |
| Distance Sensors | HC-SR04 (x6) | Train position detection |
| Camera | USB Webcam | MJPEG streaming |
| Power | 12V 5A + 5V 3A | Motors + Pi power |

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
      <img src="https://skillicons.dev/icons?i=rust" width="48" height="48" alt="Rust" />
      <br>Rust
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
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=raspberrypi" width="48" height="48" alt="Raspberry Pi" />
      <br>Pi 4
    </td>
  </tr>
</table>

### Frontend Stack
| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL (Neon) + Prisma ORM |
| **Auth** | NextAuth.js v4 (JWT) |
| **Styling** | Tailwind CSS |
| **Caching** | Upstash Redis |
| **Queue** | QStash (scheduled jobs) |
| **Payments** | Stripe, PayPal, Coinbase Commerce |
| **Real-time** | Server-Sent Events (SSE) |
| **PWA** | next-pwa with Service Worker |
| **Deployment** | Vercel (Edge + Serverless) |

### Backend Stack (Raspberry Pi)
| Category | Technology |
|----------|------------|
| **Language** | Rust 1.75+ |
| **Framework** | Actix-web 4 |
| **Hardware** | rppal (GPIO), serialport |
| **Async** | Tokio runtime |
| **Camera** | v4l2 + MJPEG |
| **Config** | TOML |

---

## API Reference

### Cloud API (Next.js)

#### Public Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leaderboards` | GET | Fetch high scores by game mode |
| `/api/tournaments` | GET | List active tournaments |
| `/api/tournaments/[id]/leaderboard` | GET | Tournament rankings |
| `/api/health` | GET | System health check |

#### Authenticated Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user` | GET | Current user data + token balance |
| `/api/user/modules` | POST | Unlock building module |
| `/api/user/stats` | GET | Play statistics |
| `/api/sessions` | GET/POST | Session history / Start session |
| `/api/games` | POST/PUT | Start/end game session |
| `/api/tournaments/[id]/register` | POST | Join tournament |
| `/api/tournaments/[id]/submit` | POST | Submit score |
| `/api/snapshots` | GET/POST | Snapshot gallery |

#### Admin Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/grant-tokens` | POST | Grant tokens to user |
| `/api/admin/tournaments/[id]` | PATCH/DELETE | Manage tournament |

### Hardware API (Raspberry Pi)

See [docs/API.md](docs/API.md) for complete Rust backend API documentation.

---

## Environment Variables

### Frontend (.env)

```bash
# Required
DATABASE_URL="postgresql://..."           # Neon PostgreSQL
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Caching & Queue
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="..."

# Hardware Connection (Live Mode)
NEXT_PUBLIC_API_URL="http://raspberry-pi.local:5000"

# Payments (optional)
STRIPE_SECRET_KEY="sk_..."
PAYPAL_CLIENT_ID="..."
COINBASE_COMMERCE_API_KEY="..."

# Admin
ADMIN_KEY="your-admin-key"
ADMIN_USER_IDS="user-id-1,user-id-2"
```

### Backend (config.toml on Pi)

```toml
[server]
host = "0.0.0.0"
port = 5000

[hardware]
pwm_address = 0x40
cpx_port = "/dev/ttyACM0"

[camera]
device = "/dev/video0"
width = 640
height = 480
fps = 30
```

---

## Development

### Frontend Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run test         # Jest tests (298 tests)
```

### Database Commands

```bash
npx prisma generate  # Generate client
npx prisma db push   # Push schema
npx prisma studio    # GUI browser
npx prisma migrate dev  # Create migration
```

### Backend Commands (Rust)

```bash
cargo build          # Debug build
cargo build --release # Production build
cargo test           # Run tests
cargo run            # Run server
```

---

## Testing

```bash
# Run all tests
npm test

# Current test coverage
# - 12 test suites
# - 298 tests passing
# - API client tests
# - Hardware adapter tests
# - Game mode tests
# - Token guard tests
```

---

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy (automatic on push)

### Backend (Raspberry Pi)

```bash
# Build release binary
cargo build --release

# Create systemd service
sudo nano /etc/systemd/system/railroad.service

# Enable and start
sudo systemctl enable railroad
sudo systemctl start railroad
```

See [docs/HARDWARE.md](docs/HARDWARE.md) for complete Pi setup guide.

---

## Roadmap

### Completed (v1.4.1)
- [x] Rust backend API integration
- [x] String trackId alignment with backend
- [x] Camera control endpoints
- [x] CPX servo/gate control
- [x] Distance sensor readings
- [x] Automation sequences
- [x] Comprehensive API tests (298 tests)
- [x] Hardware health check system
- [x] Queue system for live mode sessions
- [x] Session lifecycle with heartbeat/timeout
- [x] Real-time SSE from Rust backend
- [x] Session recording and playback
- [x] Spectator mode (watch live sessions)
- [x] Priority queue (3 tiers: Priority/Express/VIP)

### Next Steps
- [ ] WebSocket upgrade (replace SSE polling)
- [ ] Multi-user concurrent control
- [ ] Mobile app release (iOS/Android)
- [ ] Voice control integration
- [ ] Train collision detection
- [ ] Automated scheduling system

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
- Rust async runtime by [Tokio](https://tokio.rs)

---

<p align="center">
  Made with <span style="color: #00f0ff;">&#9829;</span> for model railroad enthusiasts
</p>

<p align="center">
  <a href="https://railroad-arcade-v5.vercel.app">Play Now</a> •
  <a href="https://github.com/punitmishra/railroad-arcade/issues">Report Bug</a> •
  <a href="https://github.com/punitmishra/railroad-arcade/discussions">Discussions</a>
</p>
