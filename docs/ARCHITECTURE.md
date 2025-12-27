# Railroad Arcade - System Architecture

> Complete technical architecture documentation for the Railroad Arcade IoT system.

## Table of Contents

- [Overview](#overview)
- [System Components](#system-components)
- [Data Flow](#data-flow)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Hardware Layer](#hardware-layer)
- [Security Model](#security-model)
- [Scalability](#scalability)

---

## Overview

Railroad Arcade is a distributed IoT system with three main layers:

1. **Cloud Layer** (Vercel) - Next.js frontend, API routes, database
2. **Edge Layer** (Raspberry Pi) - Rust backend, hardware control
3. **Physical Layer** - Model railroad, sensors, actuators

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   USERS                                          │
│                    Web Browser / Mobile App / Kiosk                              │
└─────────────────────────────────────────────────────────────┬───────────────────┘
                                                              │
                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLOUD LAYER                                         │
│                              (Vercel Edge)                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         Next.js 14 Application                            │   │
│  │                                                                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │   React     │  │  API Routes │  │  Middleware │  │  Server Actions │  │   │
│  │  │   Frontend  │  │  (Route     │  │  (Auth,     │  │  (Form          │  │   │
│  │  │   (RSC)     │  │   Handlers) │  │   Rate Lim) │  │   Processing)   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  │                                                                           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐    │
│  │  PostgreSQL  │  │   Redis      │  │   QStash    │  │  NextAuth.js      │    │
│  │  (Neon)      │  │  (Upstash)   │  │  (Jobs)     │  │  (Authentication) │    │
│  │              │  │              │  │              │  │                   │    │
│  │  • Users     │  │  • Sessions  │  │  • Tourney  │  │  • JWT Tokens     │    │
│  │  • Games     │  │  • Cache     │  │    Status   │  │  • OAuth          │    │
│  │  • Scores    │  │  • Rate Lim  │  │  • Prizes   │  │  • Credentials    │    │
│  │  • Tourneys  │  │  • Locks     │  │  • Cleanup  │  │                   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────┬───────────────────┘
                                                              │
                                                              │ HTTPS
                                                              │ (Public Internet)
                                                              │
┌─────────────────────────────────────────────────────────────┴───────────────────┐
│                              EDGE LAYER                                          │
│                         (Raspberry Pi 4)                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                      Rust Backend (Actix-web)                             │   │
│  │                                                                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │   HTTP      │  │  Hardware   │  │   Camera    │  │   Automation    │  │   │
│  │  │   Server    │  │  Controller │  │   Stream    │  │   Engine        │  │   │
│  │  │   :5000     │  │             │  │   :8080     │  │                 │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  │                                                                           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐    │
│  │   I2C Bus    │  │    Serial    │  │    GPIO     │  │   V4L2 Camera     │    │
│  │  (PCA9685)   │  │   (CPX)      │  │  (Sensors)  │  │   (USB)           │    │
│  │              │  │              │  │              │  │                   │    │
│  │  • PWM Ch 0  │  │  • Servo 1-4 │  │  • HC-SR04  │  │  • 640x480       │    │
│  │  • PWM Ch 1  │  │  • Gate      │  │    Trigger  │  │  • 30 FPS        │    │
│  │  • PWM Ch 2  │  │  • LEDs      │  │    Echo     │  │  • MJPEG         │    │
│  │              │  │  • Sound     │  │              │  │                   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────┬───────────────────┘
                                                              │
                                                              │ Electrical
                                                              │
┌─────────────────────────────────────────────────────────────┴───────────────────┐
│                            PHYSICAL LAYER                                        │
│                        (HO Scale Model Railroad)                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                          2-LEVEL TRACK LAYOUT                            │    │
│  │                                                                          │    │
│  │   LEVEL 2 (Upper)                    LEVEL 1 (Lower)                     │    │
│  │   ┌────────────────────┐            ┌────────────────────┐               │    │
│  │   │  Track 1 (Green)   │            │  Track 3 (Orange)  │               │    │
│  │   │  Track 2 (Blue)    │            │                    │               │    │
│  │   │  Junction J2, J3   │            │  Junction J1       │               │    │
│  │   │  Crossing X2, X3   │            │  Crossing X1       │               │    │
│  │   │  Signals S4-S6     │            │  Signals S1-S3     │               │    │
│  │   └────────────────────┘            └────────────────────┘               │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  Components:                                                                     │
│  • 3 DC Motor Trains (12V)         • 6 Distance Sensors (HC-SR04)              │
│  • 3 Track Segments with Feeders   • 1 USB Camera (Logitech C920)              │
│  • 4 Servo Junctions               • 7 Lighting Zones (LEDs)                   │
│  • 1 Crossing Gate (Servo)         • Sound Module (CPX Buzzer)                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## System Components

### Cloud Services

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend Hosting | Vercel | Edge deployment, CDN |
| Database | Neon | PostgreSQL (serverless) |
| Cache | Upstash Redis | Session cache, rate limiting |
| Job Queue | Upstash QStash | Tournament automation |
| Auth | NextAuth.js | JWT-based authentication |
| Payments | Stripe/PayPal/Coinbase | Token purchases |

### On-Premise Hardware

| Component | Model | Interface | Purpose |
|-----------|-------|-----------|---------|
| Single Board Computer | Raspberry Pi 4 (4GB) | - | Main controller |
| PWM Driver | PCA9685 | I2C (0x40) | Motor speed control |
| Microcontroller | Circuit Playground Express | USB Serial | Servos, sounds, LEDs |
| Distance Sensors | HC-SR04 (x6) | GPIO | Train detection |
| Camera | USB Webcam | USB/V4L2 | Video streaming |

---

## Data Flow

### Demo Mode (Simulation)

```
User Action → React Component → DemoAdapter → Local State → UI Update
                                    │
                                    └─ No network calls
                                    └─ Instant response
                                    └─ No token cost
```

### Live Mode (Real Hardware)

```
User Action → React Component → TokenGuard → LiveAdapter → Fetch API
       │              │              │             │            │
       │              │              │             │            ▼
       │              │              │             │     Raspberry Pi
       │              │              │             │     (Rust Backend)
       │              │              │             │            │
       │              │              │             │            ▼
       │              │              │             │     Hardware Action
       │              │              │             │            │
       │              │              │             ◄────────────┘
       │              │              │       Response
       │              │              │             │
       │              │              ◄─────────────┘
       │              │         Deduct Tokens
       │              │              │
       │              ◄──────────────┘
       │         Update State
       │              │
       ◄──────────────┘
    UI Update
```

### SSE Real-Time Updates

```
Server → SSE Stream → EventSource → State Update → UI
           │
           ├─ queue_update (position, wait time)
           ├─ session_update (remaining time)
           └─ tournament_update (scores, status)
```

---

## Frontend Architecture

### Directory Structure

```
app/                           # Next.js App Router
├── api/                       # API Route Handlers
│   ├── auth/                  # NextAuth endpoints
│   ├── payments/              # Payment providers
│   ├── tournaments/           # Tournament CRUD
│   └── user/                  # User data
├── (pages)/                   # Route groups
│   ├── kiosk/                 # Arcade cabinet mode
│   ├── leaderboards/          # High scores
│   └── admin/                 # Admin panel
└── page.tsx                   # Main app entry

components/
├── LiveTrackLayout.tsx        # SVG track visualization
├── TrainControl.tsx           # Speed/direction controls
├── GameModeSelector.tsx       # Mode selection
├── MultiCameraGrid.tsx        # Camera layouts
└── TournamentBanner.tsx       # Tournament UI

hooks/
├── useHardwareAdapter.ts      # Hardware abstraction
├── useGameSession.ts          # Game state management
├── useTournament.ts           # Tournament integration
└── useSounds.tsx              # Audio system

lib/
├── hardware/
│   ├── HardwareAdapter.ts     # Interface definition
│   ├── DemoAdapter.ts         # Simulation (client-side)
│   └── LiveAdapter.ts         # Real hardware (API calls)
├── api.ts                     # Rust backend API client
├── game-modes/                # Game engines
└── contexts/                  # React contexts
```

### Hardware Adapter Pattern

```typescript
// Abstract interface for hardware operations
interface HardwareAdapter {
  // Train control
  setTrainSpeed(trackId: string, speed: number): Promise<void>;
  setTrainDirection(trackId: string, direction: TrainDirection): Promise<void>;
  stopTrain(trackId: string): Promise<void>;
  emergencyStop(): Promise<void>;

  // Junction/Crossing control
  toggleJunction(id: string): Promise<void>;
  toggleCrossing(id: string): Promise<void>;

  // State subscription
  subscribe(callback: (state: LayoutState) => void): () => void;
}

// DemoAdapter: Local simulation, no network
class DemoAdapter implements HardwareAdapter {
  // Updates local state immediately
  // Runs animation loop for train movement
  // No token charges
}

// LiveAdapter: Real hardware via Rust API
class LiveAdapter implements HardwareAdapter {
  // Calls Raspberry Pi REST API
  // Polls for state updates (1000ms)
  // Token charges apply
}
```

---

## Backend Architecture

### Rust Backend Structure

```
pi-railroad-controller/
├── src/
│   ├── main.rs              # Entry point, Actix server
│   ├── api/                 # Route handlers
│   │   ├── tracks.rs        # Train control endpoints
│   │   ├── cpx.rs           # CPX endpoints (servo, gate)
│   │   ├── camera.rs        # Camera control
│   │   └── status.rs        # System status
│   ├── hardware/            # Hardware drivers
│   │   ├── pwm.rs           # PCA9685 PWM driver
│   │   ├── cpx.rs           # CPX serial communication
│   │   ├── distance.rs      # HC-SR04 driver
│   │   └── camera.rs        # V4L2 camera
│   ├── models.rs            # Data structures
│   └── config.rs            # Configuration
├── config.toml              # Runtime config
└── Cargo.toml               # Dependencies
```

### API Response Format

All endpoints return a consistent wrapper:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error response:

```json
{
  "success": false,
  "data": null,
  "error": "Error message here"
}
```

### Hardware Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                      Rust Backend Process                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │ Actix-web    │◄──── HTTP Requests (Port 5000)                │
│  │ Server       │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Hardware Abstraction Layer               │       │
│  ├──────────────┬──────────────┬───────────────────────┤       │
│  │              │              │                        │       │
│  │  ┌───────┐   │  ┌───────┐   │  ┌─────────────────┐  │       │
│  │  │ rppal │   │  │serial │   │  │  v4l2/rscam    │  │       │
│  │  │ (I2C) │   │  │ port  │   │  │  (Camera)      │  │       │
│  │  └───┬───┘   │  └───┬───┘   │  └───────┬────────┘  │       │
│  │      │       │      │       │          │           │       │
│  └──────┼───────┴──────┼───────┴──────────┼───────────┘       │
│         │              │                   │                    │
└─────────┼──────────────┼───────────────────┼────────────────────┘
          │              │                   │
          ▼              ▼                   ▼
     ┌─────────┐   ┌──────────┐        ┌──────────┐
     │ PCA9685 │   │   CPX    │        │   USB    │
     │  (I2C)  │   │ (Serial) │        │  Camera  │
     │         │   │          │        │          │
     │ PWM 0-2 │   │ Servo 1-4│        │  V4L2    │
     │ (Motors)│   │ Gate     │        │  MJPEG   │
     │         │   │ LED/Sound│        │          │
     └─────────┘   └──────────┘        └──────────┘
```

---

## Hardware Layer

### PCA9685 PWM Configuration

```
Channel 0: Track 1 Motor (Level 2)
Channel 1: Track 2 Motor (Level 2)
Channel 2: Track 3 Motor (Level 1)

Frequency: 1000 Hz (motor control)
Address: 0x40 (default)

Speed mapping:
  0-100 (app) → 0-4095 (PWM duty cycle)
```

### CPX Serial Protocol

Commands sent to Circuit Playground Express:

```
SERVO:<num>:<angle>\n     # Set servo (1-4) to angle (0-180)
GATE:<position>\n          # Set gate ("up" or "down")
LED:<color>\n              # Set LED (red, green, blue, off)
SOUND:<name>\n             # Play sound (whistle, bell, horn)
STATUS\n                   # Request status report
```

Status response:

```json
{
  "servos": [0, 45, 0, 90],
  "gate": "up",
  "temperature": 25.5,
  "light": 150,
  "button_a": false,
  "button_b": false
}
```

### HC-SR04 Distance Sensors

```
┌────────────────────────────────────────────────────────────────┐
│                     Sensor Positions                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Level 2:                           Level 1:                    │
│  ┌─────┐     ┌─────┐               ┌─────┐     ┌─────┐         │
│  │ S1  │     │ S2  │               │ S5  │     │ S6  │         │
│  │     │     │     │               │     │     │     │         │
│  └──┬──┘     └──┬──┘               └──┬──┘     └──┬──┘         │
│     │           │                     │           │             │
│     ▼           ▼                     ▼           ▼             │
│  Station A   Station B            Station C   Station D         │
│                                                                 │
│  Readings:                                                      │
│  - Distance in mm (0-4000)                                     │
│  - Update rate: 100ms                                          │
│  - Blocked threshold: < 150mm                                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Security Model

### Authentication Flow

```
1. User logs in via NextAuth (credentials/OAuth)
2. JWT token issued (24h expiry)
3. Token stored in httpOnly cookie
4. API routes verify token via getServerSession()
5. Raspberry Pi API is network-isolated (local or VPN)
```

### Authorization Levels

| Level | Access |
|-------|--------|
| Guest | Demo mode only, no tokens |
| User | Demo + Live (with tokens) |
| Admin | All + tournament management, token grants |

### Rate Limiting

```typescript
// Implemented via Upstash Redis
const rateLimiter = new Ratelimit({
  redis: Redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 req per 10s
});
```

### Token System

- Tokens are purchased via Stripe/PayPal/Coinbase
- Actions in Live Mode consume tokens
- Token balance stored in PostgreSQL
- Atomic deduction on action execution

---

## Scalability

### Current Limits

| Component | Limit | Notes |
|-----------|-------|-------|
| Concurrent users (Demo) | Unlimited | Vercel Edge |
| Concurrent users (Live) | 1 | Physical hardware |
| API requests | 100k/day | Vercel Pro |
| Database connections | 100 | Neon pooling |
| Redis connections | 3000 | Upstash |

### Future Scaling Options

1. **Queue System**: Multiple users queue for Live Mode time slots
2. **Multiple Pis**: Scale with multiple physical layouts
3. **WebSocket Gateway**: Replace SSE for bi-directional real-time
4. **CDN Streaming**: HLS for camera instead of MJPEG

---

## Version History

| Version | Changes |
|---------|---------|
| v1.4.0 | Rust backend integration, string trackIds |
| v1.3.0 | Performance optimization, removed fake features |
| v1.2.0 | Capacitor mobile, safe area support |
| v1.1.0 | Tournament system |
| v1.0.0 | Initial release |
