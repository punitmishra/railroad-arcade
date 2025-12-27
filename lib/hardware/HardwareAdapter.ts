// ============================================
// Hardware Adapter Interface
// ============================================
// This interface abstracts hardware operations so components
// can work with both simulation (DemoAdapter) and real
// hardware (LiveAdapter) without code changes.

export type TrainDirection = 'forward' | 'reverse' | 'stopped';

export interface TrainState {
  trackId: string;  // String ID to match Rust backend ("1", "2", "3")
  name: string;
  speed: number;
  direction: TrainDirection;
  position: number; // 0-1 position on track
  level: number;
  headlights: boolean;
  carts: number;
  color: string;
}

export interface JunctionState {
  id: string;
  name: string;
  level: number;
  position: 'straight' | 'diverge';
}

export interface CrossingState {
  id: string;
  name: string;
  level: number;
  isOpen: boolean;
  gatePosition: 'up' | 'down';
}

export interface SignalState {
  id: string;
  level: number;
  color: 'green' | 'yellow' | 'red';
  // Additional field for signal state from distance sensors
  state?: 'green' | 'yellow' | 'red';
}

export interface SceneryState {
  timeOfDay: 'sunrise' | 'day' | 'sunset' | 'night';
  weather: 'clear' | 'cloudy' | 'rain' | 'snow';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  lightsOn: boolean;
}

export interface SystemStatus {
  connected: boolean;
  tracksOnline: number;
  cameraOnline: boolean;
  cpxOnline: boolean;
  lastUpdate: number;
}

// ============================================
// Hardware Adapter Interface
// ============================================

export interface HardwareAdapter {
  // System
  getStatus(): Promise<SystemStatus>;
  emergencyStop(): Promise<void>;

  // Train Control
  getTrains(): Promise<TrainState[]>;
  setTrainSpeed(trackId: string, speed: number): Promise<void>;
  setTrainDirection(trackId: string, direction: TrainDirection): Promise<void>;
  stopTrain(trackId: string): Promise<void>;
  toggleHeadlights(trackId: string): Promise<void>;

  // Junction Control
  getJunctions(): Promise<JunctionState[]>;
  toggleJunction(id: string): Promise<void>;
  setJunctionPosition(id: string, position: 'straight' | 'diverge'): Promise<void>;

  // Crossing Control
  getCrossings(): Promise<CrossingState[]>;
  toggleCrossing(id: string): Promise<void>;
  setCrossingGate(id: string, position: 'up' | 'down'): Promise<void>;

  // Signals
  getSignals(): Promise<SignalState[]>;

  // Scenery
  getScenery(): Promise<SceneryState>;
  setScenery(scenery: Partial<SceneryState>): Promise<void>;

  // Sound
  playSound(name: string): Promise<void>;

  // Subscription for real-time updates (optional)
  subscribe?(callback: (state: LayoutState) => void): () => void;
}

// ============================================
// Combined Layout State
// ============================================

export interface LayoutState {
  trains: TrainState[];
  junctions: JunctionState[];
  crossings: CrossingState[];
  signals: SignalState[];
  scenery: SceneryState;
  system: SystemStatus;
}

// ============================================
// Default States
// ============================================

export const DEFAULT_TRAINS: TrainState[] = [
  {
    trackId: '1',
    name: 'Valley Runner',
    speed: 45,
    direction: 'forward',
    position: 0,
    level: 2,
    headlights: true,
    carts: 4,
    color: '#22c55e',
  },
  {
    trackId: '2',
    name: 'City Limited',
    speed: 0,
    direction: 'stopped',
    position: 0.25,
    level: 2,
    headlights: false,
    carts: 6,
    color: '#3b82f6',
  },
  {
    trackId: '3',
    name: 'Mountain Express',
    speed: 55,
    direction: 'forward',
    position: 0.5,
    level: 1,
    headlights: true,
    carts: 3,
    color: '#f59e0b',
  },
];

export const DEFAULT_JUNCTIONS: JunctionState[] = [
  { id: 'J1', name: 'Valley Junction', level: 1, position: 'straight' },
  { id: 'J2', name: 'East Switch', level: 2, position: 'straight' },
  { id: 'J3', name: 'West Switch', level: 2, position: 'diverge' },
];

export const DEFAULT_CROSSINGS: CrossingState[] = [
  { id: 'X1', name: 'Main Street Crossing', level: 1, isOpen: true, gatePosition: 'up' },
  { id: 'X2', name: 'Oak Avenue', level: 2, isOpen: true, gatePosition: 'up' },
  { id: 'X3', name: 'Pine Road', level: 2, isOpen: false, gatePosition: 'down' },
];

export const DEFAULT_SIGNALS: SignalState[] = [
  { id: 'S1', level: 1, color: 'green' },
  { id: 'S2', level: 1, color: 'green' },
  { id: 'S3', level: 1, color: 'yellow' },
  { id: 'S4', level: 2, color: 'green' },
  { id: 'S5', level: 2, color: 'red' },
  { id: 'S6', level: 2, color: 'green' },
];

export const DEFAULT_SCENERY: SceneryState = {
  timeOfDay: 'day',
  weather: 'clear',
  season: 'summer',
  lightsOn: false,
};

export const DEFAULT_SYSTEM: SystemStatus = {
  connected: false,
  tracksOnline: 0,
  cameraOnline: false,
  cpxOnline: false,
  lastUpdate: 0,
};
