# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run start    # Run production server
npm run lint     # Run ESLint
```

## Architecture

This is a Next.js 14 App Router application for controlling a 2-level HO scale model railroad. The frontend provides an arcade-style interface with token-based access to control trains, scenery, and interactive buildings remotely via a Raspberry Pi backend.

### Key Directories

- `app/` - Next.js App Router pages and global styles
- `components/` - React components (all use 'use client' directive)
- `lib/api.ts` - API client for Raspberry Pi control server

### Component Architecture

**Page Structure** (`app/page.tsx`):
- Main `RailroadArcade` component manages global state (tokens, session, unlocked modules)
- Tab-based navigation: Overview, Trains, Scenery, Buildings, Sensors, Camera, Streaming, Gallery, History
- Session system: users spend tokens to start timed sessions

**UI Components** (`components/ui.tsx`):
- `ArcadeButton` - Primary buttons with variants (primary, secondary, danger, ghost, success)
- `ModulePanel` - Container for control modules with lock overlay
- `ControlButton` - Toggle controls with color states
- `TokenDisplay` / `SessionTimer` - Header status components
- `VehicleCard` / `StatCard` - Building module cards

**Feature Modules**:
- `LiveTrackLayout.tsx` - Real-time SVG track visualization with train positions, signals, junctions
- `SceneryControl.tsx` - Time of day, lighting zones, water features, boats, animated elements
- `TrainTrackingModule.tsx` - Individual train speed/direction control
- `Modules.tsx` - FireStation, Cafe, SmartHome, ConstructionZone, DiamondCrossing modules
- `PoliceStationModule.tsx` - Police station with vehicle deployment

**Icons** (`components/icons.tsx`):
- 60+ custom SVG icon components with consistent `IconProps` interface
- Pattern: `({ size = 24, ...props }: IconProps) => <svg ...>`

### API Integration

The `lib/api.ts` module connects to a Raspberry Pi running a control server. Key endpoints:
- `/api/status`, `/api/emergency-stop` - System control
- `/api/tracks/:id/speed`, `/api/tracks/:id/forward|reverse|stop` - Track control
- `/api/cpx/*` - CPX/CRICKIT hardware (servos, LEDs, sounds, gates)
- `/api/scenery` - Scenery state (time of day, lights, water)
- `/api/camera/*` - Camera streaming
- `/api/distance/*` - Distance sensors

Configure API URL via `NEXT_PUBLIC_API_URL` env variable (defaults to `http://localhost:5000`).

### Styling

- Tailwind CSS with custom dark theme
- CSS variables in `app/globals.css` define color palette (cyan, purple, gold for tokens)
- Fonts: Orbitron (display), Inter (body), JetBrains Mono (monospace)
- Design uses neon accents, glassmorphism, and gradient effects

### Track Layout Constants

In `LiveTrackLayout.tsx`:
- Level 2: Express Line (upper level) - 2 trains
- Level 1: Local Line (lower level) - 1 train
- Fixed SVG dimensions: 700x450
- Stations: Grand Central (L2), Valley Station (L1)
