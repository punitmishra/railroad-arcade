'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  TrainIcon, ActivityIcon, ArrowUpIcon, ArrowDownIcon,
  PlayIcon, PauseIcon, AlertIcon, EyeIcon, BatteryIcon,
  SunIcon, MoonIcon, MapIcon, SettingsIcon, ClockIcon,
  ZapIcon, ChartIcon, BellIcon
} from './icons';
import { useHardwareAdapter } from '@/hooks/useHardwareAdapter';
import { TokenConfirmDialog, useTokenConfirmation } from './TokenConfirmDialog';
import { useGameMode } from '@/lib/contexts/ModeContext';
import { getActionCost } from '@/lib/pricing';
import { useSounds } from '@/hooks/useSounds';

// ============================================
// FIXED LAYOUT CONSTANTS
// ============================================
const SVG_WIDTH = 700;
const SVG_HEIGHT = 450;

const LEVEL2 = {
  cx: 350, cy: 130,
  rx: 260, ry: 80,
  color: '#0ea5e9',
  name: 'Level 2 - Express Line'
};

const LEVEL1 = {
  cx: 350, cy: 340,
  rx: 240, ry: 70,
  color: '#a855f7',
  name: 'Level 1 - Local Line'
};

// Speed zones on tracks (position 0-1, speed limit)
const SPEED_ZONES = [
  { level: 2, start: 0.2, end: 0.3, limit: 30, name: 'Station Approach' },
  { level: 2, start: 0.7, end: 0.8, limit: 40, name: 'Curve Zone' },
  { level: 1, start: 0.15, end: 0.25, limit: 25, name: 'Tunnel Zone' },
  { level: 1, start: 0.65, end: 0.75, limit: 25, name: 'Tunnel Zone' },
];

// Station positions (0-1 on track)
const STATIONS = [
  { id: 'GC', name: 'Grand Central', level: 2, position: 0.25, dwellTime: 5 },
  { id: 'VS', name: 'Valley Station', level: 1, position: 0.75, dwellTime: 4 },
];

// ============================================
// TYPES
// ============================================
interface Train {
  id: string;
  name: string;
  color: string;
  speed: number;
  targetSpeed: number;
  direction: 'forward' | 'reverse' | 'stopped';
  position: number;
  level: 1 | 2;
  carts: number;
  headlights: boolean;
  autopilot: boolean;
  laps: number;
  totalDistance: number;
  atStation: string | null;
  dwellTimer: number;
  history: { x: number; y: number }[];
}

interface Signal {
  id: string;
  level: 1 | 2;
  position: number;
  state: 'green' | 'yellow' | 'red';
}

interface Junction {
  id: string;
  name: string;
  level: 1 | 2;
  state: 'straight' | 'diverge';
  x: number;
  y: number;
}

interface Crossing {
  id: string;
  name: string;
  level: 1 | 2;
  state: 'open' | 'closed';
  x: number;
  y: number;
}

interface ProximityWarning {
  train1: string;
  train2: string;
  distance: number;
}

// ============================================
// HELPERS
// ============================================
function getEllipsePoint(cx: number, cy: number, rx: number, ry: number, t: number) {
  const theta = t * Math.PI * 2;
  const x = cx + rx * Math.cos(theta);
  const y = cy + ry * Math.sin(theta);
  const angle = Math.atan2(ry * Math.cos(theta), -rx * Math.sin(theta)) * (180 / Math.PI);
  return { x, y, angle };
}

function getTrackLength(rx: number, ry: number): number {
  // Approximate ellipse circumference
  return Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// ============================================
// MAIN COMPONENT
// ============================================

interface LiveTrackLayoutProps {
  mode?: 'demo' | 'live';
  tokenBalance?: number;
  onTokenBalanceChange?: (balance: number) => void;
}

export function LiveTrackLayout({
  mode: propMode,
  tokenBalance = 0,
  onTokenBalanceChange,
}: LiveTrackLayoutProps = {}) {
  // Try to get mode from context, fall back to prop, then default to 'demo'
  let contextMode: 'demo' | 'live' = 'demo';
  try {
    const gameModeContext = useGameMode();
    contextMode = gameModeContext.mode;
  } catch {
    // Context not available, use prop or default
  }
  const mode = propMode ?? contextMode;

  // Token confirmation dialog
  const { requestConfirmation, dialogProps, Dialog } = useTokenConfirmation(tokenBalance);

  // Sound effects
  const { play: playSound } = useSounds();

  // Hardware adapter integration
  const {
    state: adapterState,
    actions: adapterActions,
  } = useHardwareAdapter({
    mode,
    onTokenBalanceChange,
    onError: (error) => console.error('Hardware error:', error),
    onActionConfirmRequired: requestConfirmation,
  });

  // View controls
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 'both'>('both');
  const [showLabels, setShowLabels] = useState(true);
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [showSpeedZones, setShowSpeedZones] = useState(true);
  const [timeScale, setTimeScale] = useState(1);
  const [showSignals, setShowSignals] = useState(true);
  
  // Session stats
  const [sessionTime, setSessionTime] = useState(0);
  const [totalLaps, setTotalLaps] = useState(0);
  
  // Animation
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Trains
  const [trains, setTrains] = useState<Train[]>([
    { id: 'T1', name: 'Valley Runner', color: '#22c55e', speed: 45, targetSpeed: 45, direction: 'forward', position: 0.1, level: 2, carts: 4, headlights: true, autopilot: false, laps: 0, totalDistance: 0, atStation: null, dwellTimer: 0, history: [] },
    { id: 'T2', name: 'City Limited', color: '#3b82f6', speed: 0, targetSpeed: 0, direction: 'stopped', position: 0.55, level: 2, carts: 6, headlights: false, autopilot: false, laps: 0, totalDistance: 0, atStation: null, dwellTimer: 0, history: [] },
    { id: 'T3', name: 'Mountain Express', color: '#f59e0b', speed: 55, targetSpeed: 55, direction: 'forward', position: 0.4, level: 1, carts: 3, headlights: true, autopilot: false, laps: 0, totalDistance: 0, atStation: null, dwellTimer: 0, history: [] },
  ]);

  // Signals (block signals around track)
  const [signals, setSignals] = useState<Signal[]>([
    { id: 'S1', level: 2, position: 0.0, state: 'green' },
    { id: 'S2', level: 2, position: 0.25, state: 'green' },
    { id: 'S3', level: 2, position: 0.5, state: 'green' },
    { id: 'S4', level: 2, position: 0.75, state: 'green' },
    { id: 'S5', level: 1, position: 0.0, state: 'green' },
    { id: 'S6', level: 1, position: 0.5, state: 'green' },
  ]);

  // Junctions
  const [junctions, setJunctions] = useState<Junction[]>([
    { id: 'J1', name: 'Valley Jct', level: 1, state: 'straight', x: 110, y: 340 },
    { id: 'J2', name: 'East Switch', level: 2, state: 'straight', x: 560, y: 130 },
    { id: 'J3', name: 'West Switch', level: 2, state: 'straight', x: 140, y: 130 },
  ]);

  // Crossings
  const [crossings, setCrossings] = useState<Crossing[]>([
    { id: 'X1', name: 'Main St', level: 1, state: 'open', x: 590, y: 340 },
    { id: 'X2', name: 'Oak Ave', level: 2, state: 'open', x: 250, y: 50 },
    { id: 'X3', name: 'Pine Rd', level: 2, state: 'closed', x: 450, y: 50 },
  ]);

  // Proximity warnings
  const [warnings, setWarnings] = useState<ProximityWarning[]>([]);

  // Get train position
  const getTrainPosition = useCallback((train: Train) => {
    const level = train.level === 1 ? LEVEL1 : LEVEL2;
    const point = getEllipsePoint(level.cx, level.cy, level.rx, level.ry, train.position);
    let rotation = point.angle;
    if (train.direction === 'reverse') rotation += 180;
    return { x: point.x, y: point.y, rotation };
  }, []);

  // Calculate ETA to next station
  const getETAToStation = useCallback((train: Train) => {
    if (train.speed === 0) return null;
    
    const station = STATIONS.find(s => s.level === train.level);
    if (!station) return null;
    
    let distance = station.position - train.position;
    if (train.direction === 'forward') {
      if (distance < 0) distance += 1;
    } else {
      distance = train.position - station.position;
      if (distance < 0) distance += 1;
    }
    
    const level = train.level === 1 ? LEVEL1 : LEVEL2;
    const trackLength = getTrackLength(level.rx, level.ry);
    const distanceUnits = distance * trackLength;
    const speedUnitsPerSec = (train.speed / 100) * trackLength * 0.125;
    
    if (speedUnitsPerSec === 0) return null;
    return distanceUnits / speedUnitsPerSec;
  }, []);

  // Check speed zones
  const getSpeedLimit = useCallback((train: Train) => {
    const zone = SPEED_ZONES.find(z => 
      z.level === train.level && 
      train.position >= z.start && 
      train.position <= z.end
    );
    return zone?.limit || 100;
  }, []);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = ((timestamp - lastTimeRef.current) / 1000) * timeScale;
    lastTimeRef.current = timestamp;

    if (!isPaused) {
      // Update session time
      setSessionTime(prev => prev + deltaTime);
      
      setTrains(prevTrains => {
        const newTrains = prevTrains.map(train => {
          if (train.direction === 'stopped' && train.speed === 0 && !train.atStation) {
            return train;
          }

          const level = train.level === 1 ? LEVEL1 : LEVEL2;
          const trackLength = getTrackLength(level.rx, level.ry);
          
          // Handle station dwell
          if (train.atStation) {
            const newDwell = train.dwellTimer - deltaTime;
            if (newDwell <= 0) {
              return { ...train, atStation: null, dwellTimer: 0 };
            }
            return { ...train, dwellTimer: newDwell };
          }

          // Speed zone enforcement (autopilot)
          let effectiveSpeed = train.speed;
          if (train.autopilot) {
            const limit = getSpeedLimit(train);
            effectiveSpeed = Math.min(train.targetSpeed, limit);
          }

          // Smooth speed transitions
          let newSpeed = train.speed;
          if (train.autopilot && effectiveSpeed !== train.speed) {
            const diff = effectiveSpeed - train.speed;
            const change = Math.sign(diff) * Math.min(Math.abs(diff), 20 * deltaTime);
            newSpeed = train.speed + change;
          }

          if (newSpeed === 0 && train.direction !== 'stopped') {
            return { ...train, speed: 0, direction: 'stopped' as const };
          }

          // Position update
          const speedFactor = (newSpeed / 100) * 0.125;
          const delta = deltaTime * speedFactor * (train.direction === 'forward' ? 1 : -1);
          let newPosition = train.position + delta;
          
          // Track laps
          let newLaps = train.laps;
          if (newPosition >= 1) {
            newPosition -= 1;
            newLaps++;
            setTotalLaps(prev => prev + 1);
            // Dispatch lap complete event for scoring
            window.dispatchEvent(new CustomEvent('railroad:lapComplete', {
              detail: { trainId: train.id, trainName: train.name, totalLaps: newLaps }
            }));
          }
          if (newPosition < 0) {
            newPosition += 1;
            newLaps++;
            setTotalLaps(prev => prev + 1);
            // Dispatch lap complete event for scoring
            window.dispatchEvent(new CustomEvent('railroad:lapComplete', {
              detail: { trainId: train.id, trainName: train.name, totalLaps: newLaps }
            }));
          }

          // Update distance
          const distanceDelta = Math.abs(delta) * trackLength;
          const newDistance = train.totalDistance + distanceDelta;

          // Check for station arrival (autopilot)
          let atStation: string | null = null;
          let dwellTimer = 0;
          if (train.autopilot) {
            const station = STATIONS.find(s => 
              s.level === train.level && 
              Math.abs(s.position - newPosition) < 0.02
            );
            if (station) {
              atStation = station.id;
              dwellTimer = station.dwellTime;
            }
          }

          // Update history for trail (reduced from 30 to 15 for performance)
          const pos = getEllipsePoint(level.cx, level.cy, level.rx, level.ry, newPosition);
          const newHistory = [...train.history, { x: pos.x, y: pos.y }].slice(-15);

          return {
            ...train,
            speed: newSpeed,
            position: newPosition,
            laps: newLaps,
            totalDistance: newDistance,
            atStation,
            dwellTimer,
            history: newHistory
          };
        });

        // Check proximity
        const newWarnings: ProximityWarning[] = [];
        for (let i = 0; i < newTrains.length; i++) {
          for (let j = i + 1; j < newTrains.length; j++) {
            if (newTrains[i].level === newTrains[j].level) {
              const pos1 = getEllipsePoint(
                newTrains[i].level === 1 ? LEVEL1.cx : LEVEL2.cx,
                newTrains[i].level === 1 ? LEVEL1.cy : LEVEL2.cy,
                newTrains[i].level === 1 ? LEVEL1.rx : LEVEL2.rx,
                newTrains[i].level === 1 ? LEVEL1.ry : LEVEL2.ry,
                newTrains[i].position
              );
              const pos2 = getEllipsePoint(
                newTrains[j].level === 1 ? LEVEL1.cx : LEVEL2.cx,
                newTrains[j].level === 1 ? LEVEL1.cy : LEVEL2.cy,
                newTrains[j].level === 1 ? LEVEL1.rx : LEVEL2.rx,
                newTrains[j].level === 1 ? LEVEL1.ry : LEVEL2.ry,
                newTrains[j].position
              );
              const dist = getDistance(pos1, pos2);
              if (dist < 60) {
                newWarnings.push({ train1: newTrains[i].id, train2: newTrains[j].id, distance: dist });
                // Dispatch near miss event for scoring (only for very close encounters)
                if (dist < 40) {
                  window.dispatchEvent(new CustomEvent('railroad:nearMiss', {
                    detail: { train1Id: newTrains[i].id, train2Id: newTrains[j].id, distance: dist }
                  }));
                }
              }
            }
          }
        }
        setWarnings(newWarnings);

        // Update signals based on train positions
        setSignals(prev => prev.map(signal => {
          const trainNear = newTrains.some(t => 
            t.level === signal.level && 
            t.speed > 0 &&
            Math.abs(t.position - signal.position) < 0.15
          );
          const trainApproaching = newTrains.some(t => 
            t.level === signal.level && 
            t.speed > 0 &&
            Math.abs(t.position - signal.position) < 0.25 &&
            Math.abs(t.position - signal.position) >= 0.15
          );
          return {
            ...signal,
            state: trainNear ? 'red' : trainApproaching ? 'yellow' : 'green'
          };
        }));

        return newTrains;
      });
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isPaused, timeScale, getSpeedLimit]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  // Handlers - integrated with hardware adapter
  const toggleJunction = async (id: string) => {
    if (mode === 'live') {
      // Use adapter action with token enforcement
      const success = await adapterActions.toggleJunction(id);
      if (!success) return;
    }
    playSound('junction');
    // Update local state (demo mode or after successful live action)
    const junction = junctions.find(j => j.id === id);
    setJunctions(prev => prev.map(j =>
      j.id === id ? { ...j, state: j.state === 'straight' ? 'diverge' : 'straight' } : j
    ));
    // Dispatch event for scoring
    window.dispatchEvent(new CustomEvent('railroad:junctionSwitch', {
      detail: { junctionId: id, junctionName: junction?.name || id }
    }));
  };

  const toggleCrossing = async (id: string) => {
    if (mode === 'live') {
      // Use adapter action with token enforcement
      const success = await adapterActions.toggleCrossing(id);
      if (!success) return;
    }
    playSound('crossing');
    // Update local state (demo mode or after successful live action)
    const crossing = crossings.find(c => c.id === id);
    setCrossings(prev => prev.map(c =>
      c.id === id ? { ...c, state: c.state === 'open' ? 'closed' : 'open' } : c
    ));
    // Dispatch event for scoring
    window.dispatchEvent(new CustomEvent('railroad:crossingToggle', {
      detail: { crossingId: id, crossingName: crossing?.name || id }
    }));
  };

  // Get token cost for display
  const getTokenCostLabel = (action: string): string => {
    if (mode === 'demo') return '';
    const cost = getActionCost(action);
    return cost > 0 ? ` (${cost}🪙)` : '';
  };

  const setTrainSpeed = async (trainId: string, speed: number) => {
    // Find train to get trackId for live mode
    const train = trains.find(t => t.id === trainId);
    const isStarting = train && train.speed === 0 && speed > 0;
    const isStopping = train && train.speed > 0 && speed === 0;

    if (mode === 'live' && train) {
      // Map trainId to trackId (T1->1, T2->2, T3->3)
      const trackId = parseInt(trainId.replace('T', ''));
      const success = await adapterActions.setTrainSpeed(trackId, speed);
      if (!success && isStarting) return; // Only block if starting (costs tokens)
    }

    // Play appropriate sound
    if (isStarting) {
      playSound('train_start');
    } else if (isStopping) {
      playSound('train_stop');
    }

    setTrains(prev => prev.map(t => {
      if (t.id !== trainId) return t;
      return {
        ...t,
        speed: t.autopilot ? t.speed : speed,
        targetSpeed: speed,
        direction: speed > 0 ? (t.direction === 'stopped' ? 'forward' : t.direction) : 'stopped'
      };
    }));
  };

  const toggleDirection = (trainId: string) => {
    setTrains(prev => prev.map(t => 
      t.id === trainId ? { ...t, direction: t.direction === 'forward' ? 'reverse' : 'forward' } : t
    ));
  };

  const toggleAutopilot = (trainId: string) => {
    setTrains(prev => prev.map(t => 
      t.id === trainId ? { ...t, autopilot: !t.autopilot } : t
    ));
  };

  const toggleHeadlights = (trainId: string) => {
    setTrains(prev => prev.map(t => 
      t.id === trainId ? { ...t, headlights: !t.headlights } : t
    ));
  };

  const addCart = (trainId: string) => {
    setTrains(prev => prev.map(t => 
      t.id === trainId ? { ...t, carts: Math.min(t.carts + 1, 12) } : t
    ));
  };

  const removeCart = (trainId: string) => {
    setTrains(prev => prev.map(t => 
      t.id === trainId ? { ...t, carts: Math.max(t.carts - 1, 1) } : t
    ));
  };

  const emergencyStop = useCallback(async () => {
    if (mode === 'live') {
      // Emergency stop is free but still goes through adapter
      await adapterActions.emergencyStop();
    }

    setTrains(prev => prev.map(t => ({
      ...t,
      speed: 0,
      targetSpeed: 0,
      direction: 'stopped' as const,
      autopilot: false
    })));
  }, [mode, adapterActions]);

  // Listen for global emergency stop events
  useEffect(() => {
    const handleGlobalEmergencyStop = () => {
      emergencyStop();
    };
    window.addEventListener('railroad:emergencyStop', handleGlobalEmergencyStop);
    return () => {
      window.removeEventListener('railroad:emergencyStop', handleGlobalEmergencyStop);
    };
  }, [emergencyStop]);

  const isLevelVisible = (level: 1 | 2) => activeLevel === 'both' || activeLevel === level;

  // Render speed zones as arcs
  const renderSpeedZone = (zone: typeof SPEED_ZONES[0]) => {
    const level = zone.level === 1 ? LEVEL1 : LEVEL2;
    const startAngle = zone.start * Math.PI * 2;
    const endAngle = zone.end * Math.PI * 2;
    
    const x1 = level.cx + level.rx * Math.cos(startAngle);
    const y1 = level.cy + level.ry * Math.sin(startAngle);
    const x2 = level.cx + level.rx * Math.cos(endAngle);
    const y2 = level.cy + level.ry * Math.sin(endAngle);
    
    const largeArc = (zone.end - zone.start) > 0.5 ? 1 : 0;
    
    return (
      <path
        key={`zone-${zone.level}-${zone.start}`}
        d={`M ${x1} ${y1} A ${level.rx} ${level.ry} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="28"
        opacity="0.15"
      />
    );
  };

  return (
    <div className="bg-[#0a0a0f] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-0 border-b border-white/[0.06] bg-gradient-to-r from-cyan-500/5 to-purple-500/5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/20">
            <ActivityIcon size={16} className="text-cyan-400 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-xs sm:text-sm tracking-wide flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Live Track Control
              {warnings.length > 0 && (
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] sm:text-[10px] font-bold animate-pulse">
                  ⚠ PROXIMITY
                </span>
              )}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-gray-400">
              {formatTime(sessionTime)} • {trains.filter(t => t.speed > 0).length} active • {totalLaps} laps
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 w-full sm:w-auto">
          {/* Mode Indicator */}
          <div className={`px-1.5 sm:px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-1 ${
            mode === 'live'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-purple-500'}`} />
            {mode === 'live' ? 'LIVE' : 'DEMO'}
          </div>

          {/* Token Balance (Live mode only) */}
          {mode === 'live' && (
            <div className="px-1.5 sm:px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
              🪙 {tokenBalance}
            </div>
          )}

          {/* Emergency Stop */}
          <button onClick={emergencyStop} className="px-3 sm:px-4 min-h-[44px] rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 active:scale-95 text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 touch-manipulation transition-transform" aria-label="Emergency stop all trains">
            <AlertIcon size={14} /> <span className="hidden xs:inline">E-</span>STOP
          </button>

          {/* Time Scale - hidden on very small screens */}
          <div className="hidden sm:flex rounded-lg overflow-hidden border border-white/10" role="group" aria-label="Simulation speed">
            {[1, 2, 4].map(scale => (
              <button
                key={scale}
                onClick={() => setTimeScale(scale)}
                className={`px-3 min-h-[44px] text-[11px] font-medium active:scale-95 touch-manipulation transition-transform ${timeScale === scale ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                aria-label={`Set speed to ${scale}x`}
                aria-pressed={timeScale === scale}
              >
                {scale}x
              </button>
            ))}
          </div>

          {/* Play/Pause */}
          <button onClick={() => setIsPaused(!isPaused)} className={`min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center active:scale-95 touch-manipulation transition-transform ${isPaused ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`} aria-label={isPaused ? 'Resume simulation' : 'Pause simulation'}>
            {isPaused ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
          </button>

          {/* Night Mode */}
          <button onClick={() => setNightMode(!nightMode)} className={`min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center active:scale-95 touch-manipulation transition-transform ${nightMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`} aria-label={nightMode ? 'Switch to day mode' : 'Switch to night mode'}>
            {nightMode ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </button>

          {/* Level Selector */}
          <div className="flex rounded-lg overflow-hidden border border-white/10" role="group" aria-label="Track level filter">
            {(['both', 2, 1] as const).map(level => (
              <button key={level} onClick={() => setActiveLevel(level)} className={`px-3 sm:px-4 min-h-[44px] text-[10px] sm:text-[11px] font-medium active:scale-95 touch-manipulation transition-transform ${activeLevel === level ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`} aria-pressed={activeLevel === level}>
                {level === 'both' ? 'All' : `L${level}`}
              </button>
            ))}
          </div>

          {/* Toggle buttons - hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            <button onClick={() => setShowTrails(!showTrails)} className={`min-h-[28px] min-w-[28px] p-1.5 rounded-lg text-[10px] ${showTrails ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400'}`} aria-label={showTrails ? 'Hide train trails' : 'Show train trails'} aria-pressed={showTrails}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button onClick={() => setShowSpeedZones(!showSpeedZones)} className={`min-h-[28px] min-w-[28px] p-1.5 rounded-lg ${showSpeedZones ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-400'}`} aria-label={showSpeedZones ? 'Hide speed zones' : 'Show speed zones'} aria-pressed={showSpeedZones}>
              <ZapIcon size={14} />
            </button>
            <button onClick={() => setShowLabels(!showLabels)} className={`min-h-[28px] min-w-[28px] p-1.5 rounded-lg ${showLabels ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400'}`} aria-label={showLabels ? 'Hide labels' : 'Show labels'} aria-pressed={showLabels}>
              <EyeIcon size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Main SVG */}
        <div className="flex-1 relative min-h-[250px] sm:min-h-[300px] md:min-h-[350px]">
          <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet" style={{ backgroundColor: nightMode ? '#050508' : '#08080c' }}>
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="trainGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="headlightBeam" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="gradL2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={LEVEL2.color} stopOpacity="0.3" />
                <stop offset="50%" stopColor={LEVEL2.color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={LEVEL2.color} stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="gradL1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={LEVEL1.color} stopOpacity="0.3" />
                <stop offset="50%" stopColor={LEVEL1.color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={LEVEL1.color} stopOpacity="0.3" />
              </linearGradient>
              {/* Train trail gradients - one per train */}
              {trains.map(train => (
                <linearGradient key={`trail-grad-${train.id}`} id={`trailGrad-${train.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={train.color} stopOpacity="0" />
                  <stop offset="30%" stopColor={train.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={train.color} stopOpacity="0.6" />
                </linearGradient>
              ))}
              {/* Headlight cone gradient */}
              <radialGradient id="headlightCone" cx="0%" cy="50%" r="100%" fx="0%" fy="50%">
                <stop offset="0%" stopColor="#fffbe6" stopOpacity="0.8" />
                <stop offset="30%" stopColor="#fff9c4" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#fff59d" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#fff59d" stopOpacity="0" />
              </radialGradient>
              {/* Station glow gradient */}
              <radialGradient id="stationGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#22c55e" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Starfield for night mode - static for performance */}
            {nightMode && (
              <g opacity="0.4">
                {[
                  { x: 45, y: 25 }, { x: 120, y: 50 }, { x: 200, y: 35 },
                  { x: 350, y: 20 }, { x: 500, y: 30 }, { x: 650, y: 40 },
                  { x: 70, y: 380 }, { x: 310, y: 395 }, { x: 560, y: 415 },
                ].map((star, i) => (
                  <circle key={`star-${i}`} cx={star.x} cy={star.y} r={1} fill="white" />
                ))}
              </g>
            )}

            {/* Grid */}
            <g opacity={nightMode ? 0.015 : 0.03}>
              {Array.from({ length: 18 }, (_, i) => <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2={SVG_HEIGHT} stroke="#0ea5e9" strokeWidth="0.5" />)}
              {Array.from({ length: 12 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 40} x2={SVG_WIDTH} y2={i * 40} stroke="#0ea5e9" strokeWidth="0.5" />)}
            </g>

            {/* Speed Zones */}
            {showSpeedZones && SPEED_ZONES.filter(z => isLevelVisible(z.level as 1 | 2)).map(renderSpeedZone)}

            {/* LEVEL 2 TRACK */}
            {isLevelVisible(2) && (
              <g opacity={activeLevel === 1 ? 0.3 : 1}>
                <ellipse cx={LEVEL2.cx} cy={LEVEL2.cy} rx={LEVEL2.rx} ry={LEVEL2.ry} fill="none" stroke="#1a1a24" strokeWidth="26" />
                <ellipse cx={LEVEL2.cx} cy={LEVEL2.cy} rx={LEVEL2.rx} ry={LEVEL2.ry} fill="none" stroke="#2a2a36" strokeWidth="18" />
                <ellipse cx={LEVEL2.cx} cy={LEVEL2.cy} rx={LEVEL2.rx} ry={LEVEL2.ry} fill="none" stroke="#3a3a46" strokeWidth="10" />
                {/* Removed spinning animation for performance */}
                
                {/* Grand Central Station */}
                <g transform={`translate(${LEVEL2.cx}, ${LEVEL2.cy - LEVEL2.ry - 20})`}>
                  {/* Night mode ambient glow */}
                  {nightMode && (
                    <ellipse cx="0" cy="0" rx="70" ry="35" fill={LEVEL2.color} opacity="0.08" className="animate-[station-glow_3s_ease-in-out_infinite]" />
                  )}
                  <rect x="-50" y="-14" width="100" height="28" rx="4" fill="#0f172a" stroke={LEVEL2.color} strokeWidth="1.5" />
                  {[0,1,2,3].map(i => (
                    <rect key={i} x={-42 + i*12} y="-8" width="8" height="16" rx="1" fill={LEVEL2.color} opacity={nightMode ? 0.6 : 0.3} className={nightMode ? 'animate-pulse' : ''} />
                  ))}
                  <text x="30" y="5" fill={LEVEL2.color} fontSize="10" fontWeight="600" style={{ fontFamily: 'monospace' }}>GC</text>
                  {showLabels && <text x="0" y="30" textAnchor="middle" fill="#60a5fa" fontSize="10" fontWeight="500">Grand Central</text>}
                </g>
                
                <g transform="translate(25, 80)">
                  <rect width="50" height="26" rx="6" fill={LEVEL2.color} fillOpacity="0.12" stroke={LEVEL2.color} strokeWidth="1" strokeOpacity="0.3" />
                  <text x="25" y="17" textAnchor="middle" fill={LEVEL2.color} fontSize="11" fontWeight="700" style={{ fontFamily: 'monospace' }}>L2</text>
                </g>
              </g>
            )}

            {/* LEVEL 1 TRACK */}
            {isLevelVisible(1) && (
              <g opacity={activeLevel === 2 ? 0.3 : 1}>
                <ellipse cx={LEVEL1.cx} cy={LEVEL1.cy} rx={LEVEL1.rx} ry={LEVEL1.ry} fill="none" stroke="#1a1a24" strokeWidth="26" />
                <ellipse cx={LEVEL1.cx} cy={LEVEL1.cy} rx={LEVEL1.rx} ry={LEVEL1.ry} fill="none" stroke="#2a2a36" strokeWidth="18" />
                <ellipse cx={LEVEL1.cx} cy={LEVEL1.cy} rx={LEVEL1.rx} ry={LEVEL1.ry} fill="none" stroke="#3a3a46" strokeWidth="10" />
                {/* Removed spinning animation for performance */}

                {/* Tunnels */}
                {[{ x: LEVEL1.cx - LEVEL1.rx + 15 }, { x: LEVEL1.cx + LEVEL1.rx - 15 }].map((t, i) => (
                  <g key={i} transform={`translate(${t.x}, ${LEVEL1.cy - 20})`}>
                    <rect x="-16" y="0" width="32" height="22" rx="11" fill="#0a0a10" stroke="#4b5563" strokeWidth="2" />
                    <path d="M-10 22 Q 0 14 10 22" fill="none" stroke="#374151" strokeWidth="2" />
                  </g>
                ))}

                {/* Valley Station */}
                <g transform={`translate(${LEVEL1.cx}, ${LEVEL1.cy + LEVEL1.ry + 20})`}>
                  {/* Night mode ambient glow */}
                  {nightMode && (
                    <ellipse cx="0" cy="0" rx="70" ry="35" fill={LEVEL1.color} opacity="0.08" className="animate-[station-glow_3s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }} />
                  )}
                  <rect x="-50" y="-14" width="100" height="28" rx="4" fill="#1e1b2e" stroke={LEVEL1.color} strokeWidth="1.5" />
                  {[0,1,2,3].map(i => (
                    <rect key={i} x={-42 + i*12} y="-8" width="8" height="16" rx="1" fill={LEVEL1.color} opacity={nightMode ? 0.6 : 0.3} className={nightMode ? 'animate-pulse' : ''} />
                  ))}
                  <text x="30" y="5" fill={LEVEL1.color} fontSize="10" fontWeight="600" style={{ fontFamily: 'monospace' }}>VS</text>
                  {showLabels && <text x="0" y="30" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="500">Valley Station</text>}
                </g>

                <g transform="translate(25, 290)">
                  <rect width="50" height="26" rx="6" fill={LEVEL1.color} fillOpacity="0.12" stroke={LEVEL1.color} strokeWidth="1" strokeOpacity="0.3" />
                  <text x="25" y="17" textAnchor="middle" fill={LEVEL1.color} fontSize="11" fontWeight="700" style={{ fontFamily: 'monospace' }}>L1</text>
                </g>
              </g>
            )}

            {/* Signals */}
            {showSignals && signals.filter(s => isLevelVisible(s.level)).map(signal => {
              const level = signal.level === 1 ? LEVEL1 : LEVEL2;
              const pos = getEllipsePoint(level.cx, level.cy, level.rx + 25, level.ry + 25, signal.position);
              return (
                <g key={signal.id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <rect x="-4" y="-10" width="8" height="20" rx="2" fill="#1a1a24" stroke="#333" strokeWidth="1" />
                  <circle cy="-5" r="2.5" fill={signal.state === 'red' ? '#ef4444' : '#333'} opacity={signal.state === 'red' ? 1 : 0.3} />
                  <circle cy="0" r="2.5" fill={signal.state === 'yellow' ? '#f59e0b' : '#333'} opacity={signal.state === 'yellow' ? 1 : 0.3} />
                  <circle cy="5" r="2.5" fill={signal.state === 'green' ? '#22c55e' : '#333'} opacity={signal.state === 'green' ? 1 : 0.3} />
                </g>
              );
            })}

            {/* Junctions */}
            {junctions.filter(j => isLevelVisible(j.level)).map(junction => (
              <g key={junction.id} transform={`translate(${junction.x}, ${junction.y})`} onClick={() => toggleJunction(junction.id)} className="cursor-pointer" role="button" tabIndex={0} aria-label={`${junction.name}: ${junction.state === 'straight' ? 'straight' : 'diverge'}. Click to toggle`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleJunction(junction.id); }}>
                <circle r="16" fill="#0c0c14" stroke={junction.level === 1 ? LEVEL1.color : LEVEL2.color} strokeWidth="2" />
                <circle r="10" fill={junction.state === 'straight' ? '#22c55e' : '#f59e0b'} />
                <path d={junction.state === 'straight' ? 'M-5 0 L5 0' : 'M-5 0 Q 0 0 4 -5'} stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {showLabels && <text y="28" textAnchor="middle" fill="#9ca3af" fontSize="8">{junction.name}</text>}
              </g>
            ))}

            {/* Crossings */}
            {crossings.filter(c => isLevelVisible(c.level)).map(crossing => (
              <g key={crossing.id} transform={`translate(${crossing.x}, ${crossing.y})`} onClick={() => toggleCrossing(crossing.id)} className="cursor-pointer" role="button" tabIndex={0} aria-label={`${crossing.name} crossing: ${crossing.state}. Click to toggle`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCrossing(crossing.id); }}>
                <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#0c0c14" stroke={crossing.state === 'closed' ? '#ef4444' : '#22c55e'} strokeWidth="2" />
                {crossing.state === 'closed' ? (
                  <><path d="M-6 -6 L6 6 M-6 6 L6 -6" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" /><circle r="3" fill="#ef4444" className="animate-pulse" /></>
                ) : (
                  <path d="M-5 0 L5 0 M0 -5 L0 5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                )}
                {showLabels && <text y="24" textAnchor="middle" fill="#9ca3af" fontSize="7">{crossing.name}</text>}
              </g>
            ))}

            {/* Train Trails - Simplified for performance */}
            {showTrails && trains.filter(t => isLevelVisible(t.level) && t.history.length > 1 && t.speed > 0).map(train => (
              <polyline
                key={`trail-${train.id}`}
                points={train.history.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={train.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.3"
              />
            ))}

            {/* Trains */}
            {trains.filter(t => isLevelVisible(t.level)).map(train => {
              const pos = getTrainPosition(train);
              const isMoving = train.speed > 0;
              const isSelected = selectedTrain === train.id;
              const hasWarning = warnings.some(w => w.train1 === train.id || w.train2 === train.id);

              return (
                <g key={train.id}>
                  {/* Headlight beam (night mode only, rendered behind train) */}
                  {nightMode && train.headlights && (
                    <g transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.rotation})`}>
                      <ellipse
                        cx="50"
                        cy="0"
                        rx="45"
                        ry="25"
                        fill="url(#headlightCone)"
                        filter="url(#headlightBeam)"
                        className="animate-[headlight-beam_2s_ease-in-out_infinite]"
                      />
                    </g>
                  )}

                  <g transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.rotation})`} onClick={() => setSelectedTrain(isSelected ? null : train.id)} className="cursor-pointer" filter={isMoving ? 'url(#trainGlow)' : undefined}>
                    {/* Warning ring */}
                    {hasWarning && <circle r="28" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-pulse" />}

                    {/* Moving train glow - enhanced with animation */}
                    <ellipse
                      rx={isMoving ? 24 : 18}
                      ry={isMoving ? 13 : 9}
                      fill={train.color}
                      opacity={isMoving ? 0.25 : 0.1}
                      className={isMoving ? 'animate-[train-glow_1.5s_ease-in-out_infinite]' : ''}
                    />

                    {/* Body */}
                    <rect x="-15" y="-7" width="30" height="14" rx="3" fill={train.color} />
                    <rect x="-12" y="-5" width="6" height="5" rx="1" fill="rgba(255,255,255,0.2)" />
                    <rect x="-4" y="-5" width="6" height="5" rx="1" fill="rgba(255,255,255,0.2)" />
                    <rect x="4" y="-5" width="6" height="5" rx="1" fill="rgba(255,255,255,0.2)" />
                    <circle cx="-9" cy="5" r="2.5" fill="rgba(0,0,0,0.4)" />
                    <circle cx="0" cy="5" r="2.5" fill="rgba(0,0,0,0.4)" />
                    <circle cx="9" cy="5" r="2.5" fill="rgba(0,0,0,0.4)" />
                    <rect x="12" y="-4" width="4" height="8" rx="1" fill="rgba(255,255,255,0.3)" />

                    {/* Headlight - enhanced for night mode */}
                    {train.headlights && (
                      <g>
                        {nightMode && <circle cx="15" cy="0" r="4" fill="#fff" opacity="0.3" />}
                        <circle cx="15" cy="0" r="2.5" fill="#fff" opacity={nightMode ? 1 : 0.9} className={nightMode ? 'animate-pulse' : ''} />
                      </g>
                    )}

                    {/* Autopilot indicator */}
                    {train.autopilot && (
                      <g transform="translate(0, -14)">
                        <circle r="6" fill="#8b5cf6" />
                        <text y="3" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">A</text>
                      </g>
                    )}

                    {/* Station dwell */}
                    {train.atStation && (
                      <g transform="translate(0, -14)">
                        <circle r="8" fill="#22c55e" className="animate-[station-glow_1s_ease-in-out_infinite]" />
                        <text y="4" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">{Math.ceil(train.dwellTimer)}</text>
                      </g>
                    )}
                  </g>
                  
                  {/* Speed popup */}
                  {(isSelected || isMoving) && !train.atStation && (
                    <g transform={`translate(${pos.x}, ${pos.y - 32})`}>
                      <rect x="-22" y="-12" width="44" height="22" rx="4" fill="#0c0c14" stroke={train.color} strokeWidth="1.5" />
                      <text y="3" textAnchor="middle" fill={train.color} fontSize="12" fontWeight="700" style={{ fontFamily: 'monospace' }}>
                        {isMoving ? train.speed.toFixed(0) : '⏸'}
                      </text>
                    </g>
                  )}
                  
                  {/* Name when selected */}
                  {isSelected && showLabels && (
                    <g transform={`translate(${pos.x}, ${pos.y + 32})`}>
                      <rect x="-45" y="-9" width="90" height="18" rx="4" fill={train.color} />
                      <text y="4" textAnchor="middle" fill="#000" fontSize="10" fontWeight="600">{train.name}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Night overlay */}
            {nightMode && <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#000" opacity="0.25" pointerEvents="none" />}
          </svg>

          {/* Minimap */}
          {showMinimap && (
            <div className="absolute top-3 right-3 w-32 h-20 rounded-lg bg-black/70 border border-white/10 p-1.5 backdrop-blur-sm">
              <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full">
                <ellipse cx={LEVEL2.cx} cy={LEVEL2.cy} rx={LEVEL2.rx} ry={LEVEL2.ry} fill="none" stroke={LEVEL2.color} strokeWidth="5" opacity="0.5" />
                <ellipse cx={LEVEL1.cx} cy={LEVEL1.cy} rx={LEVEL1.rx} ry={LEVEL1.ry} fill="none" stroke={LEVEL1.color} strokeWidth="5" opacity="0.5" />
                {trains.map(train => {
                  const pos = getTrainPosition(train);
                  return <circle key={train.id} cx={pos.x} cy={pos.y} r="10" fill={train.color} />;
                })}
              </svg>
            </div>
          )}

          {/* Proximity warnings */}
          {warnings.length > 0 && (
            <div className="absolute top-3 left-3 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <AlertIcon size={14} className="animate-pulse" />
                PROXIMITY WARNING
              </div>
            </div>
          )}
        </div>

        {/* Telemetry Panel */}
        {showTelemetry && (
          <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-[#08080c]/70 overflow-y-auto max-h-[300px] lg:max-h-[400px]">
            <div className="p-3 border-b border-white/[0.06]">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ChartIcon size={12} /> Train Telemetry
              </h3>
            </div>
            
            {trains.map(train => {
              const eta = getETAToStation(train);
              const speedLimit = getSpeedLimit(train);
              const isOverLimit = train.speed > speedLimit;
              
              return (
                <div key={train.id} className="p-3 border-b border-white/[0.04]" style={{ borderLeftColor: train.color, borderLeftWidth: 3 }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm" style={{ color: train.color }}>{train.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${train.autopilot ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400'}`}>
                      {train.autopilot ? 'AUTO' : 'MANUAL'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white/[0.03] rounded px-2 py-1.5">
                      <div className="text-gray-400">Speed</div>
                      <div className={`font-mono font-bold ${isOverLimit ? 'text-red-400' : 'text-white'}`}>
                        {train.speed.toFixed(0)} <span className="text-gray-400">/ {speedLimit}</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] rounded px-2 py-1.5">
                      <div className="text-gray-400">Direction</div>
                      <div className="font-mono text-white">{train.direction === 'stopped' ? 'STOP' : train.direction === 'forward' ? '→ FWD' : '← REV'}</div>
                    </div>
                    <div className="bg-white/[0.03] rounded px-2 py-1.5">
                      <div className="text-gray-400">Laps</div>
                      <div className="font-mono text-white">{train.laps}</div>
                    </div>
                    <div className="bg-white/[0.03] rounded px-2 py-1.5">
                      <div className="text-gray-400">Distance</div>
                      <div className="font-mono text-white">{(train.totalDistance / 100).toFixed(1)}m</div>
                    </div>
                    <div className="bg-white/[0.03] rounded px-2 py-1.5 col-span-2">
                      <div className="text-gray-400">ETA to Station</div>
                      <div className="font-mono text-white">{eta ? formatTime(eta) : '—'}</div>
                    </div>
                  </div>
                  
                  {train.atStation && (
                    <div className="mt-2 px-2 py-1.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] text-center">
                      At station • Departing in {Math.ceil(train.dwellTimer)}s
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Session Stats */}
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Session Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white/[0.03] rounded px-2 py-1.5">
                  <div className="text-gray-400">Runtime</div>
                  <div className="font-mono text-white">{formatTime(sessionTime)}</div>
                </div>
                <div className="bg-white/[0.03] rounded px-2 py-1.5">
                  <div className="text-gray-400">Total Laps</div>
                  <div className="font-mono text-white">{totalLaps}</div>
                </div>
                <div className="bg-white/[0.03] rounded px-2 py-1.5 col-span-2">
                  <div className="text-gray-400">Total Distance</div>
                  <div className="font-mono text-white">{(trains.reduce((a, t) => a + t.totalDistance, 0) / 100).toFixed(1)}m</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Train Controls */}
      <div className="border-t border-white/[0.06] p-2 sm:p-3 bg-[#08080c]/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {trains.map(train => {
            const isSelected = selectedTrain === train.id;
            const speedLimit = getSpeedLimit(train);
            
            return (
              <div key={train.id} className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${isSelected ? 'bg-white/[0.06] border-white/20' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${train.color}20` }}>
                      <TrainIcon size={14} className="sm:w-4 sm:h-4" style={{ color: train.color }} />
                    </div>
                    <div>
                      <div className="font-medium text-xs sm:text-sm" style={{ color: train.color }}>{train.name}</div>
                      <div className="text-[8px] sm:text-[9px] text-gray-400">L{train.level} • {train.carts} cars</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold font-mono" style={{ color: train.speed > 0 ? train.color : '#666' }}>{train.speed.toFixed(0)}</div>
                    <div className="text-[7px] sm:text-[8px] text-gray-400">/{speedLimit} km/h</div>
                  </div>
                </div>

                {/* Speed slider */}
                <div className="mb-2">
                  <input
                    type="range" min="0" max="100" value={train.targetSpeed}
                    onChange={(e) => setTrainSpeed(train.id, parseInt(e.target.value))}
                    aria-label={`${train.name} speed control`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={train.targetSpeed}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, ${train.color} 0%, ${train.color} ${train.targetSpeed}%, #1a1a24 ${train.targetSpeed}%, #1a1a24 100%)` }}
                  />
                </div>

                {/* Carts control - hidden on very small screens */}
                <div className="hidden xs:flex items-center justify-between mb-2 text-[9px] sm:text-[10px]">
                  <span className="text-gray-400">Cars: {train.carts}</span>
                  <div className="flex gap-1">
                    <button onClick={() => removeCart(train.id)} className="w-6 h-6 rounded bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 min-h-[24px]" aria-label={`Remove car from ${train.name}`}>−</button>
                    <button onClick={() => addCart(train.id)} className="w-6 h-6 rounded bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 min-h-[24px]" aria-label={`Add car to ${train.name}`}>+</button>
                  </div>
                </div>

                {/* Control buttons - 44px min touch targets for mobile accessibility */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  <button
                    onClick={() => toggleDirection(train.id)}
                    disabled={train.speed === 0}
                    className="min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-[10px] sm:text-[11px] text-gray-300 hover:bg-white/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 touch-manipulation transition-transform"
                    aria-label={`Toggle ${train.name} direction`}
                  >
                    {train.direction === 'forward' ? <ArrowDownIcon size={14} /> : <ArrowUpIcon size={14} />}
                    <span className="hidden xs:inline">Dir</span>
                  </button>
                  <button
                    onClick={() => toggleHeadlights(train.id)}
                    className={`min-h-[44px] rounded-lg border text-base flex items-center justify-center active:scale-95 touch-manipulation transition-transform ${train.headlights ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    aria-label={train.headlights ? `Turn off ${train.name} headlights` : `Turn on ${train.name} headlights`}
                    aria-pressed={train.headlights}
                  >
                    💡
                  </button>
                  <button
                    onClick={() => toggleAutopilot(train.id)}
                    className={`min-h-[44px] rounded-lg border text-[10px] sm:text-[11px] font-bold flex items-center justify-center active:scale-95 touch-manipulation transition-transform ${train.autopilot ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    aria-label={train.autopilot ? `Disable ${train.name} autopilot` : `Enable ${train.name} autopilot`}
                    aria-pressed={train.autopilot}
                  >
                    AUTO
                  </button>
                  <button
                    onClick={() => setTrainSpeed(train.id, 0)}
                    className="min-h-[44px] rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] sm:text-[11px] font-bold hover:bg-red-500/30 active:scale-95 touch-manipulation transition-transform"
                    aria-label={`Stop ${train.name}`}
                  >
                    STOP
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/30 border-t border-white/[0.04] text-[9px]">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online</span>
          <span>•</span>
          <span>{trains.filter(t => t.speed > 0).length} running</span>
          <span>•</span>
          <span>{trains.filter(t => t.autopilot).length} autopilot</span>
          <span>•</span>
          <span>Speed: {timeScale}x</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTelemetry(!showTelemetry)} className={`min-h-[24px] min-w-[24px] flex items-center justify-center ${showTelemetry ? 'text-cyan-400' : 'text-gray-400 hover:text-gray-300'}`} aria-label={showTelemetry ? 'Hide telemetry panel' : 'Show telemetry panel'} aria-pressed={showTelemetry}>
            <ChartIcon size={14} />
          </button>
          <button onClick={() => setShowMinimap(!showMinimap)} className={`min-h-[24px] min-w-[24px] flex items-center justify-center ${showMinimap ? 'text-cyan-400' : 'text-gray-400 hover:text-gray-300'}`} aria-label={showMinimap ? 'Hide minimap' : 'Show minimap'} aria-pressed={showMinimap}>
            <MapIcon size={14} />
          </button>
          <span className={`font-mono ${isPaused ? 'text-amber-400' : mode === 'live' ? 'text-emerald-400' : 'text-purple-400'}`}>
            {isPaused ? '⏸ PAUSED' : mode === 'live' ? '● LIVE' : '● DEMO'}
          </span>
        </div>
      </div>

      <style jsx>{`
        /* Enhanced slider for mobile touch targets */
        input[type="range"] {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          border: 2px solid rgba(255,255,255,0.3);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 8px rgba(0,0,0,0.5);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.3);
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
        /* Touch-friendly minimum size for mobile */
        @media (max-width: 640px) {
          input[type="range"]::-webkit-slider-thumb {
            width: 24px;
            height: 24px;
          }
          input[type="range"]::-moz-range-thumb {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>

      {/* Token Confirmation Dialog */}
      <Dialog {...dialogProps} />
    </div>
  );
}
