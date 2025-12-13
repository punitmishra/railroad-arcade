# 🚂 Railroad Arcade

An elegant, interactive web application for controlling a 2-level HO scale model railroad with token-based access, real-time train tracking, and comprehensive scenery control.

![Railroad Arcade](https://via.placeholder.com/800x400/0a0a12/00f0ff?text=Railroad+Arcade)

## ✨ Features

### 🎮 Interactive Control System
- **Real-time Train Tracking** - Live SVG visualization of train positions with animated movement
- **Multi-level Layout** - Control 3 trains across 2 levels with tunnels connecting them
- **Junction Control** - Toggle 3 junctions (1 on Level 1, 2 on Level 2)
- **Railroad Crossings** - Manage 5 crossings (1 on Level 1, 4 on Level 2)

### 🎨 Scenery Control
- **Time of Day** - Dawn, Day, Sunset, Night modes with ambient lighting
- **Lighting Zones** - 11+ controllable zones (residential, commercial, entertainment, infrastructure)
- **Water Features** - Waterfalls, lakes, fountains, rivers with speed control
- **Boats** - 3 controllable boats with lights and movement
- **Animated Scenery** - Windmill, smokestacks, flag poles, clock tower, church bells

### 🏢 Building Modules
- **Police Station** - Light control, vehicle deployment
- **Fire Station** - Emergency vehicles, bay doors
- **Café** - Interior/exterior lights, drive-thru animation
- **Smart Home** - Climate control, EV charging, room lights
- **Construction Zone** - Heavy equipment, tower lights
- **Diamond Crossing** - Signal control, train simulation

### 💰 Token System
- Pay-to-play arcade model
- Session-based access (timed gameplay)
- Module unlock system
- Crypto & PayPal payment options (demo)

### 📹 Camera Integration
- Live camera feed support
- Multiple camera angles
- Recording & snapshot capabilities

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Icons**: Custom SVG components (zero dependencies)
- **Fonts**: Orbitron, Space Grotesk

## 📁 Project Structure

```
railroad-arcade/
├── app/
│   ├── globals.css          # Global styles & theme
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main arcade page
├── components/
│   ├── icons.tsx            # 60+ custom SVG icons
│   ├── ui.tsx               # Core UI components
│   ├── LiveTrackLayout.tsx  # Real-time track visualization
│   ├── SceneryControl.tsx   # Comprehensive scenery panel
│   ├── TrainTrackingModule.tsx
│   ├── PoliceStationModule.tsx
│   └── Modules.tsx          # Fire, Cafe, Home, Construction, Crossing
├── lib/
│   └── api.ts               # API client for Raspberry Pi
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── next.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone or extract the project
cd railroad-arcade

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
npm run build
npm start
```

## 🔌 API Integration

The app connects to a Raspberry Pi running the railroad control server. Configure the API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://raspberry-pi-ip:5000
```

### API Endpoints
- `GET /api/status` - System status
- `POST /api/emergency-stop` - Emergency stop all trains
- `GET /api/tracks` - Track status
- `POST /api/tracks/:id/speed` - Set track speed
- `POST /api/cpx/gate/:position` - Control crossing gates
- `GET /api/scenery` - Get scenery state
- `POST /api/scenery` - Update scenery

## 🎨 Design System

### Colors
- **Neon Cyan**: `#00f0ff` - Primary accent
- **Neon Pink**: `#ff2d95` - Highlights
- **Token Gold**: `#ffd700` - Currency/rewards
- **Background**: `#0a0a0f` - Dark base

### Typography
- **Display**: Orbitron (headers, titles)
- **Body**: Space Grotesk (content)

### Components
- `ArcadeButton` - Primary action buttons
- `ModulePanel` - Container for control modules
- `ControlButton` - Toggle/action controls
- `TokenDisplay` - Currency display
- `SessionTimer` - Countdown timer

## 📱 Responsive Design

- Mobile-first approach
- Collapsible navigation
- Touch-friendly controls
- Optimized for tablets

## 🔧 Customization

### Adding New Icons
Edit `components/icons.tsx`:

```tsx
export const NewIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}>
    {/* SVG paths */}
  </svg>
);
```

### Adding New Modules
1. Create component in `components/`
2. Import in `page.tsx`
3. Add to modules array
4. Render in appropriate tab

### Theming
Modify CSS variables in `globals.css`:

```css
:root {
  --neon-blue: #00f0ff;
  --neon-pink: #ff2d95;
  /* Add custom colors */
}
```

## 🚂 Hardware Integration

### Raspberry Pi Setup
The app expects a Rust/Python API server running on the Pi with:
- GPIO control for tracks
- CPX/CRICKIT integration
- Camera streaming
- Distance sensors

### Track Configuration
- **Level 1**: 1 train, 1 junction, 1 crossing
- **Level 2**: 2 trains, 2 junctions, 4 crossings
- **2 Stations**: Grand Central (L2), Valley Station (L1)
- **2 Tunnels**: Connecting Level 1 and Level 2

## 📝 License

MIT License - feel free to use and modify for your own projects!

## 🙏 Acknowledgments

- Designed for HO scale model railroads
- Inspired by arcade gaming aesthetics
- Built with modern web technologies

---

**Happy Railroading! 🚂✨**
