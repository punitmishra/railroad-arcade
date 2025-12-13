'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  TrainIcon, JunctionIcon, CrossingIcon, 
  PlayIcon, PauseIcon, ZapIcon, ActivityIcon,
  ArrowUpIcon, ArrowDownIcon, SettingsIcon, MaximizeIcon,
  SpeakerIcon, BellIcon, EyeIcon, LayersIcon
} from './icons';

// ============================================
// TYPES
// ============================================
interface Point { x: number; y: number; }

interface TrackSegment {
  id: string;
  type: 'straight' | 'curve' | 'switch';
  start: Point;
  end: Point;
  control1?: Point;
  control2?: Point;
  level: 1 | 2;
  length: number;
}

interface Train {
  id: string;
  name: string;
  color: string;
  accentColor: string;
  speed: number;
  targetSpeed: number;
  maxSpeed: number;
  acceleration: number;
  direction: 1 | -1;
  position: number;
  level: 1 | 2;
  carts: number;
  status: 'running' | 'stopped' | 'braking' | 'accelerating';
  headlightOn: boolean;
  hornActive: boolean;
  trackId: string;
}

interface Junction {
  id: string;
  name: string;
  position: Point;
  level: 1 | 2;
  state: 'left' | 'right';
  locked: boolean;
}

interface Crossing {
  id: string;
  name: string;
  position: Point;
  level: 1 | 2;
  state: 'open' | 'closing' | 'closed' | 'opening';
  gateAngle: number;
  warningActive: boolean;
}

interface Station {
  id: string;
  name: string;
  position: Point;
  level: 1 | 2;
  platforms: number;
  trainPresent: boolean;
}

// ============================================
// TRACK PATH CALCULATIONS
// ============================================
function bezierPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
  };
}

function bezierTangent(t: number, p0: Point, p1: Point, p2: Point, p3: Point): number {
  const mt = 1 - t;
  const dx = 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const dy = 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

// ============================================
// MAIN COMPONENT
// ============================================
export function AdvancedTrackLayout() {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const [isPaused, setIsPaused] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 'both'>('both');
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEffects, setShowEffects] = useState(true);
  
  // Track definitions using bezier curves for smooth paths
  const tracks = useMemo(() => ({
    level2Main: {
      path: 'M 60,120 C 60,50 120,30 200,30 L 400,30 C 480,30 540,50 540,120 C 540,190 480,210 400,210 L 200,210 C 120,210 60,190 60,120 Z',
      points: [
        { x: 60, y: 120 }, { x: 60, y: 50 }, { x: 120, y: 30 }, { x: 200, y: 30 },
        { x: 400, y: 30 }, { x: 480, y: 30 }, { x: 540, y: 50 }, { x: 540, y: 120 },
        { x: 540, y: 190 }, { x: 480, y: 210 }, { x: 400, y: 210 }, { x: 200, y: 210 },
        { x: 120, y: 210 }, { x: 60, y: 190 }, { x: 60, y: 120 }
      ]
    },
    level2Inner: {
      path: 'M 150,120 Q 300,180 450,120',
      points: [
        { x: 150, y: 120 }, { x: 300, y: 180 }, { x: 450, y: 120 }
      ]
    },
    level1Main: {
      path: 'M 80,320 C 80,260 130,240 200,240 L 400,240 C 470,240 520,260 520,320 C 520,380 470,400 400,400 L 200,400 C 130,400 80,380 80,320 Z',
      points: [
        { x: 80, y: 320 }, { x: 80, y: 260 }, { x: 130, y: 240 }, { x: 200, y: 240 },
        { x: 400, y: 240 }, { x: 470, y: 240 }, { x: 520, y: 260 }, { x: 520, y: 320 },
        { x: 520, y: 380 }, { x: 470, y: 400 }, { x: 400, y: 400 }, { x: 200, y: 400 },
        { x: 130, y: 400 }, { x: 80, y: 380 }, { x: 80, y: 320 }
      ]
    }
  }), []);

  const [trains, setTrains] = useState<Train[]>([
    {
      id: 'T1', name: 'Northern Express', color: '#22c55e', accentColor: '#86efac',
      speed: 0, targetSpeed: 45, maxSpeed: 100, acceleration: 8,
      direction: 1, position: 0.1, level: 2, carts: 5,
      status: 'accelerating', headlightOn: true, hornActive: false, trackId: 'level2Main'
    },
    {
      id: 'T2', name: 'City Flyer', color: '#3b82f6', accentColor: '#93c5fd',
      speed: 0, targetSpeed: 0, maxSpeed: 100, acceleration: 10,
      direction: 1, position: 0.6, level: 2, carts: 3,
      status: 'stopped', headlightOn: false, hornActive: false, trackId: 'level2Main'
    },
    {
      id: 'T3', name: 'Mountain Climber', color: '#a855f7', accentColor: '#d8b4fe',
      speed: 0, targetSpeed: 55, maxSpeed: 100, acceleration: 6,
      direction: 1, position: 0.3, level: 1, carts: 4,
      status: 'accelerating', headlightOn: true, hornActive: false, trackId: 'level1Main'
    }
  ]);

  const [junctions, setJunctions] = useState<Junction[]>([
    { id: 'J1', name: 'North Switch', position: { x: 150, y: 120 }, level: 2, state: 'left', locked: false },
    { id: 'J2', name: 'South Switch', position: { x: 450, y: 120 }, level: 2, state: 'right', locked: false },
    { id: 'J3', name: 'Valley Junction', position: { x: 150, y: 320 }, level: 1, state: 'left', locked: false }
  ]);

  const [crossings, setCrossings] = useState<Crossing[]>([
    { id: 'X1', name: 'Main Street', position: { x: 300, y: 30 }, level: 2, state: 'open', gateAngle: 0, warningActive: false },
    { id: 'X2', name: 'Oak Avenue', position: { x: 200, y: 210 }, level: 2, state: 'open', gateAngle: 0, warningActive: false },
    { id: 'X3', name: 'Pine Road', position: { x: 400, y: 210 }, level: 2, state: 'closed', gateAngle: 90, warningActive: true },
    { id: 'X4', name: 'Industrial Way', position: { x: 480, y: 120 }, level: 2, state: 'open', gateAngle: 0, warningActive: false },
    { id: 'X5', name: 'Valley Road', position: { x: 300, y: 400 }, level: 1, state: 'open', gateAngle: 0, warningActive: false }
  ]);

  const [stations] = useState<Station[]>([
    { id: 'S1', name: 'Grand Central', position: { x: 300, y: 30 }, level: 2, platforms: 2, trainPresent: false },
    { id: 'S2', name: 'Valley Station', position: { x: 300, y: 400 }, level: 1, platforms: 1, trainPresent: false }
  ]);

  // Calculate train position on track
  const getTrainPosition = useCallback((train: Train) => {
    const isLevel1 = train.level === 1;
    const centerX = 300;
    const centerY = isLevel1 ? 320 : 120;
    const radiusX = isLevel1 ? 220 : 240;
    const radiusY = isLevel1 ? 80 : 90;
    
    // Use position (0-1) to calculate angle
    const angle = train.position * Math.PI * 2 - Math.PI / 2;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);
    
    // Calculate tangent angle for rotation
    const tangentAngle = Math.atan2(
      radiusY * Math.cos(angle),
      -radiusX * Math.sin(angle)
    ) * (180 / Math.PI);
    
    return { 
      x, 
      y, 
      rotation: train.direction === -1 ? tangentAngle + 180 : tangentAngle 
    };
  }, []);

  // Physics-based animation loop
  const animate = useCallback((timestamp: number) => {
    if (isPaused) {
      lastTimeRef.current = timestamp;
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = timestamp;

    setTrains(prev => prev.map(train => {
      let { speed, targetSpeed, acceleration, position, direction, status } = train;
      
      // Smooth acceleration/deceleration with physics
      if (speed < targetSpeed) {
        speed = Math.min(speed + acceleration * deltaTime * 10, targetSpeed);
        status = 'accelerating';
      } else if (speed > targetSpeed) {
        speed = Math.max(speed - acceleration * deltaTime * 15, targetSpeed); // Braking is faster
        status = speed > 0 ? 'braking' : 'stopped';
      } else {
        status = speed > 0 ? 'running' : 'stopped';
      }
      
      // Position update with smooth movement
      if (speed > 0) {
        const speedFactor = (speed / 100) * 0.08;
        position += deltaTime * speedFactor * direction;
        
        // Wrap around
        if (position > 1) position -= 1;
        if (position < 0) position += 1;
      }
      
      return { ...train, speed, position, status };
    }));

    // Animate crossing gates
    setCrossings(prev => prev.map(crossing => {
      let { gateAngle, state } = crossing;
      const targetAngle = state === 'closed' || state === 'closing' ? 90 : 0;
      
      if (gateAngle < targetAngle) {
        gateAngle = Math.min(gateAngle + deltaTime * 120, targetAngle);
        if (gateAngle >= 90) state = 'closed';
      } else if (gateAngle > targetAngle) {
        gateAngle = Math.max(gateAngle - deltaTime * 90, targetAngle);
        if (gateAngle <= 0) state = 'open';
      }
      
      return { ...crossing, gateAngle, state };
    }));

    animationRef.current = requestAnimationFrame(animate);
  }, [isPaused]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  // Control functions
  const setTrainSpeed = (trainId: string, speed: number) => {
    setTrains(prev => prev.map(t => 
      t.id === trainId ? { ...t, targetSpeed: speed } : t
    ));
  };

  const toggleTrainDirection = (trainId: string) => {
    setTrains(prev => prev.map(t => 
      t.id === trainId ? { ...t, direction: (t.direction * -1) as 1 | -1 } : t
    ));
  };

  const emergencyStop = (trainId: string) => {
    setTrains(prev => prev.map(t => 
      t.id === trainId ? { ...t, targetSpeed: 0, status: 'braking' } : t
    ));
  };

  const toggleCrossing = (id: string) => {
    setCrossings(prev => prev.map(c => 
      c.id === id ? { 
        ...c, 
        state: c.state === 'open' ? 'closing' : 'opening',
        warningActive: c.state === 'open'
      } : c
    ));
  };

  const toggleJunction = (id: string) => {
    setJunctions(prev => prev.map(j => 
      j.id === id && !j.locked ? { ...j, state: j.state === 'left' ? 'right' : 'left' } : j
    ));
  };

  const toggleHorn = (trainId: string) => {
    setTrains(prev => prev.map(t => 
      t.id === trainId ? { ...t, hornActive: !t.hornActive } : t
    ));
  };

  const toggleHeadlight = (trainId: string) => {
    setTrains(prev => prev.map(t => 
      t.id === trainId ? { ...t, headlightOn: !t.headlightOn } : t
    ));
  };

  return (
    <div className={`bg-[#08080c] rounded-2xl border border-white/10 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-cyan-500/[0.08] via-purple-500/[0.05] to-pink-500/[0.08] border-b border-white/[0.08]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/20">
              <ActivityIcon size={24} className="text-cyan-400" />
            </div>
            {!isPaused && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#08080c]">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </span>
            )}
          </div>
          <div>
            <h3 
              className="font-bold text-lg tracking-wide bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
              style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
            >
              Advanced Track Control
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Real-time physics simulation • {trains.filter(t => t.speed > 0).length} active trains</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Effects Toggle */}
          <button
            onClick={() => setShowEffects(!showEffects)}
            className={`p-2.5 rounded-xl transition-all ${
              showEffects ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
            }`}
            title="Toggle Effects"
          >
            <ZapIcon size={16} />
          </button>
          
          {/* Play/Pause */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2.5 rounded-xl transition-all ${
              isPaused ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            {isPaused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
          </button>

          {/* Level Filter */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            {(['both', 1, 2] as const).map(level => (
              <button
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-3 py-2 text-xs font-medium transition-all ${
                  activeLevel === level 
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' 
                    : 'bg-white/[0.02] text-gray-400 hover:bg-white/[0.06]'
                }`}
              >
                {level === 'both' ? 'All' : `L${level}`}
              </button>
            ))}
          </div>

          {/* Labels Toggle */}
          <button 
            onClick={() => setShowLabels(!showLabels)}
            className={`p-2.5 rounded-xl transition-all ${
              showLabels ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 border border-transparent hover:bg-white/5'
            }`}
          >
            <EyeIcon size={16} />
          </button>

          {/* Fullscreen */}
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 rounded-xl bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 transition-all"
          >
            <MaximizeIcon size={16} />
          </button>
        </div>
      </div>

      {/* SVG Track Visualization */}
      <div className="relative p-4">
        <svg 
          ref={svgRef}
          viewBox="0 0 600 440" 
          className="w-full h-auto"
          style={{ minHeight: isFullscreen ? 'calc(100vh - 200px)' : '380px' }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="trackGradientL2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="trackGradientL1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
            </linearGradient>
            
            {/* Glow Filters */}
            <filter id="trainGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="headlightGlow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#fff" floodOpacity="0.8" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="warningGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Train Symbol */}
            <symbol id="locomotive" viewBox="-18 -10 36 20">
              <rect x="-16" y="-8" width="32" height="16" rx="4" fill="currentColor" />
              <rect x="-14" y="-6" width="8" height="6" rx="1.5" fill="rgba(0,0,0,0.3)" />
              <rect x="-4" y="-6" width="8" height="6" rx="1.5" fill="rgba(0,0,0,0.3)" />
              <rect x="6" y="-6" width="8" height="6" rx="1.5" fill="rgba(0,0,0,0.3)" />
              <circle cx="-10" cy="6" r="3" fill="rgba(0,0,0,0.4)" />
              <circle cx="0" cy="6" r="3" fill="rgba(0,0,0,0.4)" />
              <circle cx="10" cy="6" r="3" fill="rgba(0,0,0,0.4)" />
              <rect x="14" y="-3" width="4" height="6" rx="1" fill="rgba(255,255,255,0.2)" />
            </symbol>

            {/* Animated patterns */}
            <pattern id="railPattern" patternUnits="userSpaceOnUse" width="20" height="4">
              <rect width="20" height="4" fill="none" />
              <rect x="0" y="1" width="8" height="2" fill="rgba(255,255,255,0.15)" rx="1" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width="600" height="440" fill="#0a0a0f" rx="16" />
          
          {/* Grid */}
          <g opacity="0.03">
            {[...Array(13)].map((_, i) => (
              <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="440" stroke="#00f0ff" strokeWidth="0.5" />
            ))}
            {[...Array(10)].map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 50} x2="600" y2={i * 50} stroke="#00f0ff" strokeWidth="0.5" />
            ))}
          </g>

          {/* Level 2 Tracks (Upper) */}
          {(activeLevel === 'both' || activeLevel === 2) && (
            <g opacity={activeLevel === 'both' ? 1 : 1} className="transition-opacity duration-500">
              {/* Track bed */}
              <ellipse cx="300" cy="120" rx="240" ry="90" fill="none" stroke="#1a1a24" strokeWidth="28" />
              {/* Rail outer */}
              <ellipse cx="300" cy="120" rx="240" ry="90" fill="none" stroke="#2d2d3a" strokeWidth="16" />
              {/* Rail inner */}
              <ellipse cx="300" cy="120" rx="240" ry="90" fill="none" stroke="#3d3d4a" strokeWidth="10" />
              {/* Animated glow */}
              {showEffects && (
                <ellipse 
                  cx="300" cy="120" rx="240" ry="90" 
                  fill="none" 
                  stroke="url(#trackGradientL2)" 
                  strokeWidth="2" 
                  strokeDasharray="12 24"
                  className="animate-[spin_40s_linear_infinite]"
                  style={{ transformOrigin: '300px 120px' }}
                />
              )}
              
              {/* Inner crossover track */}
              <path d="M 150,120 Q 300,200 450,120" fill="none" stroke="#1a1a24" strokeWidth="20" />
              <path d="M 150,120 Q 300,200 450,120" fill="none" stroke="#2d2d3a" strokeWidth="12" />
              <path d="M 150,120 Q 300,200 450,120" fill="none" stroke="#3d3d4a" strokeWidth="8" />

              {/* Level Badge */}
              <g transform="translate(20, 60)">
                <rect width="50" height="30" rx="10" fill="#06b6d4" opacity="0.15" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.3" />
                <text x="25" y="20" textAnchor="middle" fill="#06b6d4" fontSize="13" fontWeight="700" style={{ fontFamily: 'JetBrains Mono' }}>L2</text>
              </g>
              
              {/* Station */}
              <g transform="translate(260, 10)">
                <rect width="80" height="35" rx="6" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                <rect x="6" y="6" width="6" height="23" rx="2" fill="#3b82f6" opacity="0.4" />
                <rect x="15" y="6" width="6" height="23" rx="2" fill="#3b82f6" opacity="0.4" />
                <rect x="24" y="6" width="6" height="23" rx="2" fill="#3b82f6" opacity="0.4" />
                {showLabels && (
                  <text x="40" y="52" textAnchor="middle" fill="#60a5fa" fontSize="10" fontWeight="500" style={{ fontFamily: 'Inter' }}>Grand Central</text>
                )}
              </g>
            </g>
          )}

          {/* Level 1 Tracks (Lower) */}
          {(activeLevel === 'both' || activeLevel === 1) && (
            <g opacity={activeLevel === 'both' ? 1 : 1} className="transition-opacity duration-500">
              {/* Track bed */}
              <ellipse cx="300" cy="320" rx="220" ry="80" fill="none" stroke="#1a1a24" strokeWidth="28" />
              {/* Rail outer */}
              <ellipse cx="300" cy="320" rx="220" ry="80" fill="none" stroke="#2d2d3a" strokeWidth="16" />
              {/* Rail inner */}
              <ellipse cx="300" cy="320" rx="220" ry="80" fill="none" stroke="#3d3d4a" strokeWidth="10" />
              {/* Animated glow */}
              {showEffects && (
                <ellipse 
                  cx="300" cy="320" rx="220" ry="80" 
                  fill="none" 
                  stroke="url(#trackGradientL1)" 
                  strokeWidth="2" 
                  strokeDasharray="12 24"
                  className="animate-[spin_35s_linear_infinite_reverse]"
                  style={{ transformOrigin: '300px 320px' }}
                />
              )}

              {/* Tunnel indicators */}
              {[{ x: 100, label: 'Tunnel A' }, { x: 500, label: 'Tunnel B' }].map((tunnel, i) => (
                <g key={i} transform={`translate(${tunnel.x}, 290)`}>
                  <ellipse rx="22" ry="30" fill="#0c0c14" stroke="#4b5563" strokeWidth="2" />
                  <path d="M-15 30 Q 0 15 15 30" fill="none" stroke="#374151" strokeWidth="2" />
                  {showLabels && (
                    <text y="48" textAnchor="middle" fill="#6b7280" fontSize="9" style={{ fontFamily: 'Inter' }}>{tunnel.label}</text>
                  )}
                </g>
              ))}

              {/* Level Badge */}
              <g transform="translate(20, 280)">
                <rect width="50" height="30" rx="10" fill="#a855f7" opacity="0.15" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.3" />
                <text x="25" y="20" textAnchor="middle" fill="#a855f7" fontSize="13" fontWeight="700" style={{ fontFamily: 'JetBrains Mono' }}>L1</text>
              </g>
              
              {/* Station */}
              <g transform="translate(260, 395)">
                <rect width="80" height="35" rx="6" fill="#1e1b2e" stroke="#a855f7" strokeWidth="2" />
                <rect x="6" y="6" width="6" height="23" rx="2" fill="#a855f7" opacity="0.4" />
                <rect x="15" y="6" width="6" height="23" rx="2" fill="#a855f7" opacity="0.4" />
                {showLabels && (
                  <text x="40" y="-8" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="500" style={{ fontFamily: 'Inter' }}>Valley Station</text>
                )}
              </g>
            </g>
          )}

          {/* Junctions */}
          {junctions
            .filter(j => activeLevel === 'both' || j.level === activeLevel)
            .map(junction => (
              <g 
                key={junction.id}
                transform={`translate(${junction.position.x}, ${junction.position.y})`}
                className="cursor-pointer"
                onClick={() => toggleJunction(junction.id)}
              >
                <circle r="22" fill="#0c0c14" stroke={junction.level === 1 ? '#a855f7' : '#06b6d4'} strokeWidth="2" />
                <circle r="14" fill={junction.state === 'left' ? '#22c55e' : '#f59e0b'} opacity="0.9" />
                <path 
                  d={junction.state === 'left' ? 'M-8 0 L8 0' : 'M-6 0 Q 0 0 5 -6'} 
                  stroke="white" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  fill="none"
                />
                {junction.locked && (
                  <text y="1" textAnchor="middle" fill="white" fontSize="10">🔒</text>
                )}
                {showLabels && (
                  <text y="38" textAnchor="middle" fill="#9ca3af" fontSize="9" style={{ fontFamily: 'Inter' }}>{junction.name}</text>
                )}
              </g>
            ))}

          {/* Crossings */}
          {crossings
            .filter(c => activeLevel === 'both' || c.level === activeLevel)
            .map(crossing => (
              <g 
                key={crossing.id}
                transform={`translate(${crossing.position.x}, ${crossing.position.y})`}
                className="cursor-pointer"
                onClick={() => toggleCrossing(crossing.id)}
                filter={crossing.warningActive && showEffects ? 'url(#warningGlow)' : undefined}
              >
                <rect x="-18" y="-18" width="36" height="36" rx="8" fill="#0c0c14" stroke={crossing.state === 'closed' || crossing.state === 'closing' ? '#ef4444' : '#22c55e'} strokeWidth="2" />
                
                {/* Gate arms */}
                <g transform={`rotate(${crossing.gateAngle}, -12, 0)`}>
                  <rect x="-14" y="-2" width="20" height="4" rx="2" fill={crossing.gateAngle > 45 ? '#ef4444' : '#fff'} />
                </g>
                <g transform={`rotate(${-crossing.gateAngle}, 12, 0)`}>
                  <rect x="-6" y="-2" width="20" height="4" rx="2" fill={crossing.gateAngle > 45 ? '#ef4444' : '#fff'} />
                </g>
                
                {/* Warning lights */}
                {crossing.warningActive && (
                  <>
                    <circle cx="-8" cy="-10" r="3" fill="#ef4444" className="animate-pulse" />
                    <circle cx="8" cy="-10" r="3" fill="#ef4444" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </>
                )}
                
                {showLabels && (
                  <text y="32" textAnchor="middle" fill="#9ca3af" fontSize="8" style={{ fontFamily: 'Inter' }}>{crossing.name}</text>
                )}
              </g>
            ))}

          {/* Trains */}
          {trains
            .filter(t => activeLevel === 'both' || t.level === activeLevel)
            .map(train => {
              const pos = getTrainPosition(train);
              const isSelected = selectedTrain === train.id;
              return (
                <g 
                  key={train.id}
                  transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.rotation})`}
                  className="cursor-pointer"
                  onClick={() => setSelectedTrain(isSelected ? null : train.id)}
                  filter={train.speed > 0 && showEffects ? 'url(#trainGlow)' : undefined}
                >
                  {/* Motion blur effect */}
                  {train.speed > 30 && showEffects && (
                    <ellipse 
                      rx={20 + train.speed / 5} 
                      ry={10} 
                      fill={train.color} 
                      opacity={0.15}
                    />
                  )}
                  
                  {/* Train glow */}
                  <ellipse 
                    rx={isSelected ? 32 : 26} 
                    ry={isSelected ? 18 : 14} 
                    fill={train.color} 
                    opacity={train.speed > 0 ? 0.25 : 0.1}
                  />
                  
                  {/* Locomotive */}
                  <use href="#locomotive" fill={train.color} />
                  
                  {/* Headlight */}
                  {train.headlightOn && (
                    <g filter={showEffects ? 'url(#headlightGlow)' : undefined}>
                      <ellipse cx="18" cy="0" rx="3" ry="2" fill="#fff" opacity="0.95" />
                      {showEffects && (
                        <path 
                          d="M 20,-4 L 45,-8 L 45,8 L 20,4 Z" 
                          fill="url(#headlightBeam)" 
                          opacity="0.1"
                        />
                      )}
                    </g>
                  )}
                  
                  {/* Carts indicator */}
                  {[...Array(Math.min(train.carts, 4))].map((_, i) => (
                    <rect 
                      key={i}
                      x={-24 - i * 12}
                      y="-4"
                      width="10"
                      height="8"
                      rx="2"
                      fill={train.color}
                      opacity={0.6 - i * 0.1}
                    />
                  ))}
                </g>
              );
            })}
          
          {/* Train Info Overlays */}
          {trains
            .filter(t => activeLevel === 'both' || t.level === activeLevel)
            .filter(t => selectedTrain === t.id || t.speed > 0)
            .map(train => {
              const pos = getTrainPosition(train);
              return (
                <g key={`info-${train.id}`} transform={`translate(${pos.x}, ${pos.y - 35})`}>
                  <rect x="-28" y="-14" width="56" height="26" rx="8" fill="#0c0c14" stroke={train.color} strokeWidth="1.5" />
                  <text y="4" textAnchor="middle" fill={train.color} fontSize="13" fontWeight="600" style={{ fontFamily: 'JetBrains Mono' }}>
                    {train.speed > 0 ? `${Math.round(train.speed)}` : '⏸'}
                  </text>
                  {train.hornActive && (
                    <text x="20" y="4" fill="#f59e0b" fontSize="10">🔔</text>
                  )}
                  {selectedTrain === train.id && showLabels && (
                    <g transform="translate(0, 60)">
                      <rect x="-45" y="-10" width="90" height="22" rx="6" fill={train.color} />
                      <text y="5" textAnchor="middle" fill="#000" fontSize="10" fontWeight="600" style={{ fontFamily: 'Inter' }}>{train.name}</text>
                    </g>
                  )}
                </g>
              );
            })}
        </svg>
      </div>

      {/* Train Control Panels */}
      <div className="border-t border-white/[0.06] p-5 bg-gradient-to-b from-[#0a0a0f] to-[#08080c]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trains.map(train => {
            const isSelected = selectedTrain === train.id;
            return (
              <div 
                key={train.id}
                className={`
                  p-4 rounded-2xl border-2 transition-all cursor-pointer
                  ${isSelected 
                    ? 'bg-white/[0.06] shadow-lg scale-[1.02]' 
                    : 'bg-white/[0.02] hover:bg-white/[0.04]'
                  }
                `}
                style={{ borderColor: isSelected ? train.color : 'rgba(255,255,255,0.08)' }}
                onClick={() => setSelectedTrain(isSelected ? null : train.id)}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center border"
                    style={{ backgroundColor: `${train.color}15`, borderColor: `${train.color}30` }}
                  >
                    <TrainIcon size={24} style={{ color: train.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{train.name}</span>
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-md font-bold"
                        style={{ backgroundColor: train.level === 1 ? 'rgba(168,85,247,0.15)' : 'rgba(6,182,212,0.15)', color: train.level === 1 ? '#a855f7' : '#06b6d4' }}
                      >
                        L{train.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className={train.speed > 0 ? 'text-emerald-400' : ''}>{Math.round(train.speed)} km/h</span>
                      <span>•</span>
                      <span className={`capitalize ${
                        train.status === 'running' ? 'text-emerald-400' :
                        train.status === 'accelerating' ? 'text-cyan-400' :
                        train.status === 'braking' ? 'text-amber-400' : 'text-gray-500'
                      }`}>{train.status}</span>
                    </div>
                  </div>
                </div>

                {/* Speed Control */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-500">Target Speed</span>
                    <span style={{ color: train.color, fontFamily: 'JetBrains Mono' }}>{train.targetSpeed}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={train.targetSpeed}
                    onChange={(e) => { e.stopPropagation(); setTrainSpeed(train.id, Number(e.target.value)); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${train.color} 0%, ${train.color} ${train.targetSpeed}%, rgba(255,255,255,0.1) ${train.targetSpeed}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                  {/* Speed presets */}
                  <div className="flex gap-1 mt-2">
                    {[0, 25, 50, 75, 100].map(speed => (
                      <button
                        key={speed}
                        onClick={(e) => { e.stopPropagation(); setTrainSpeed(train.id, speed); }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          train.targetSpeed === speed 
                            ? 'bg-white/15 text-white' 
                            : 'bg-white/5 text-gray-500 hover:bg-white/10'
                        }`}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleTrainDirection(train.id); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-all"
                  >
                    {train.direction === 1 ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />}
                    <span className="text-xs font-medium">{train.direction === 1 ? 'FWD' : 'REV'}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleHeadlight(train.id); }}
                    className={`p-2.5 rounded-xl transition-all ${
                      train.headlightOn ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}
                  >
                    💡
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleHorn(train.id); }}
                    className={`p-2.5 rounded-xl transition-all ${
                      train.hornActive ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}
                  >
                    <BellIcon size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); emergencyStop(train.id); }}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    ⏹
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#06060a] border-t border-white/[0.04]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 10px rgba(34,197,94,0.6)' }} />
            <span className="text-xs text-gray-500">System Online</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span><span className="text-white font-semibold">{trains.filter(t => t.speed > 0).length}</span> trains moving</span>
            <span><span className="text-white font-semibold">{junctions.length}</span> junctions</span>
            <span><span className="text-white font-semibold">{crossings.filter(c => c.state === 'closed').length}</span> crossings active</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500 flex items-center gap-1">
            <ZapIcon size={12} className="text-cyan-400" />
            60 FPS
          </span>
          <span 
            className={`font-bold px-2 py-1 rounded ${isPaused ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}
            style={{ fontFamily: 'JetBrains Mono' }}
          >
            {isPaused ? 'PAUSED' : 'LIVE'}
          </span>
        </div>
      </div>
    </div>
  );
}
