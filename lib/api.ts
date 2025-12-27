// Railroad Arcade - API Client
// Connects to the Raspberry Pi Rust control server

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ========================================
// TYPES - Matching Rust backend models.rs
// ========================================

// API Response wrapper from Rust backend
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Track types - matches Rust TrackStatus
export type Direction = 'forward' | 'reverse' | 'stop';

export interface TrackStatus {
  id: string;          // Backend uses string IDs ("1", "2", "3")
  name: string;
  speed: number;       // 0-100
  direction: Direction;
  running: boolean;    // Backend uses "running" not "active"
}

// CPX types - matches Rust CpxStatus
export type GateState = 'up' | 'down';

export interface CpxStatus {
  connected: boolean;
  servos: [number, number, number, number];  // 4 servos
  ldr_raw: [number, number, number];         // 3 LDR sensors
  ldr_blocked: [boolean, boolean, boolean];
  gate: GateState;
  auto_gate: boolean;
}

// Distance sensor - matches Rust DistanceReading
export interface DistanceReading {
  name: string;
  distance_cm: number;
  blocked: boolean;
}

// Camera - matches Rust CameraStatus
export interface CameraStatus {
  running: boolean;
  stream_url?: string;
}

// System status - matches Rust SystemStatus
export interface SystemStatus {
  controller: boolean;   // GPIO available
  cpx: boolean;          // CPX connected
  camera: boolean;       // Camera running
  tracks: TrackStatus[];
  cpx_status?: CpxStatus;
  distances: DistanceReading[];
  camera_url?: string;
}

// Scenery - matches Rust SceneryState
export interface LightingState {
  residential: boolean;
  entertainment: boolean;
  station1: boolean;
  station2: boolean;
  parking: boolean;
  tunnels: boolean;
  streets: boolean;
}

export interface WaterState {
  waterfall1: boolean;
  waterfall2: boolean;
  harbor: boolean;
  boats: boolean;
}

export interface SceneryState {
  time_of_day: 'day' | 'sunset' | 'night';
  lighting: LightingState;
  water_features: WaterState;
}

// Schedule - matches Rust Schedule
export interface Schedule {
  id: number;
  name: string;
  track_id: string;
  action: string;
  speed: number;
  time?: string;
  duration: number;
  enabled: boolean;
}

// Automation - matches Rust AutomationSequence
export interface AutomationStep {
  action: string;
  target?: string;
  value?: unknown;
  delay_ms: number;
}

export interface AutomationSequence {
  id: string;
  name: string;
  description: string;
  steps: AutomationStep[];
}

// ========================================
// API FETCH HELPER
// ========================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public apiError?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new ApiError(
        `API Error: ${res.status}`,
        res.status,
        errorBody.error
      );
    }

    const json: ApiResponse<T> = await res.json();

    if (!json.success) {
      throw new ApiError(json.error || 'Unknown error', 400, json.error);
    }

    return json.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

// ========================================
// SYSTEM ENDPOINTS
// ========================================

export const getStatus = () => apiFetch<SystemStatus>('/api/status');

export const emergencyStop = () =>
  apiFetch<void>('/api/emergency-stop', { method: 'POST' });

// ========================================
// TRACK ENDPOINTS
// ========================================

export const getTracks = () => apiFetch<TrackStatus[]>('/api/tracks');

export const getTrack = (id: string) =>
  apiFetch<TrackStatus>(`/api/tracks/${id}`);

export const setTrackSpeed = (id: string, speed: number, smooth = false) =>
  apiFetch<TrackStatus>(`/api/tracks/${id}/speed`, {
    method: 'POST',
    body: JSON.stringify({ speed, smooth }),
  });

export const setTrackForward = (id: string, speed?: number) =>
  apiFetch<TrackStatus>(`/api/tracks/${id}/forward`, {
    method: 'POST',
    body: speed !== undefined ? JSON.stringify({ speed }) : undefined,
  });

export const setTrackReverse = (id: string, speed?: number) =>
  apiFetch<TrackStatus>(`/api/tracks/${id}/reverse`, {
    method: 'POST',
    body: speed !== undefined ? JSON.stringify({ speed }) : undefined,
  });

export const stopTrack = (id: string) =>
  apiFetch<TrackStatus>(`/api/tracks/${id}/stop`, { method: 'POST' });

// ========================================
// CPX ENDPOINTS
// ========================================

export const getCpxStatus = () => apiFetch<CpxStatus>('/api/cpx/status');

export const setGate = (position: GateState) =>
  apiFetch<CpxStatus>(`/api/cpx/gate/${position}`, { method: 'POST' });

export const setServo = (num: number, angle: number) =>
  apiFetch<void>(`/api/cpx/servo/${num}`, {
    method: 'POST',
    body: JSON.stringify({ angle }),
  });

export const calibrateServos = () =>
  apiFetch<void>('/api/cpx/calibrate', { method: 'POST' });

export const playSound = (name: string) =>
  apiFetch<void>(`/api/cpx/sound/${name}`, { method: 'POST' });

export const setLed = (color: string) =>
  apiFetch<void>(`/api/cpx/led/${color}`, { method: 'POST' });

export const getCpxTemperature = () => apiFetch<number>('/api/cpx/temp');

// ========================================
// CAMERA ENDPOINTS
// ========================================

export const getCameraStatus = () => apiFetch<CameraStatus>('/api/camera/status');

export const startCamera = () =>
  apiFetch<CameraStatus>('/api/camera/start', { method: 'POST' });

export const stopCamera = () =>
  apiFetch<CameraStatus>('/api/camera/stop', { method: 'POST' });

// ========================================
// DISTANCE SENSOR ENDPOINTS
// ========================================

export const getDistances = () => apiFetch<DistanceReading[]>('/api/distance');

export const getDistance = (name: string) =>
  apiFetch<DistanceReading>(`/api/distance/${name}`);

// ========================================
// SCENERY ENDPOINTS
// ========================================

export const getScenery = () => apiFetch<SceneryState>('/api/scenery');

export const setScenery = (state: Partial<SceneryState>) =>
  apiFetch<SceneryState>('/api/scenery', {
    method: 'POST',
    body: JSON.stringify(state),
  });

// ========================================
// SCHEDULE ENDPOINTS
// ========================================

export const getSchedules = () => apiFetch<Schedule[]>('/api/schedules');

export const createSchedule = (schedule: Omit<Schedule, 'id'>) =>
  apiFetch<Schedule>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(schedule),
  });

export const deleteSchedule = (id: number) =>
  apiFetch<void>(`/api/schedules/${id}`, { method: 'DELETE' });

// ========================================
// AUTOMATION ENDPOINTS
// ========================================

export const getSequences = () => apiFetch<AutomationSequence[]>('/api/automation/sequences');

export const runSequence = (id: string) =>
  apiFetch<string>(`/api/automation/run/${id}`, { method: 'POST' });

// ========================================
// DEFAULT CONFIGURATIONS
// ========================================

export const DEFAULT_LOCOMOTIVES = [
  { trackId: '1', name: 'Valley Runner', color: '#22c55e', level: 2, carts: 4 },
  { trackId: '2', name: 'City Limited', color: '#3b82f6', level: 2, carts: 6 },
  { trackId: '3', name: 'Mountain Express', color: '#a855f7', level: 1, carts: 3 },
];

export const DEFAULT_JUNCTIONS = [
  { id: 'J1', level: 1, name: 'Valley Junction', servoNum: 2 },
  { id: 'J2', level: 2, name: 'East Switch', servoNum: 3 },
  { id: 'J3', level: 2, name: 'West Switch', servoNum: 4 },
];

export const DEFAULT_CROSSINGS = [
  { id: 'X1', level: 1, name: 'Main Street Crossing', servoNum: 1 },
  { id: 'X2', level: 2, name: 'Oak Avenue' },
  { id: 'X3', level: 2, name: 'Pine Road' },
  { id: 'X4', level: 2, name: 'Maple Drive' },
  { id: 'X5', level: 2, name: 'Industrial Way' },
];

export const DEFAULT_STATIONS = [
  { id: 'S1', level: 2, name: 'Grand Central' },
  { id: 'S2', level: 1, name: 'Valley Station' },
];

export const DEFAULT_DISTANCE_SENSORS = [
  { name: 'station1', label: 'Station 1 Approach', trigPin: 23, echoPin: 24 },
  { name: 'crossing1', label: 'Crossing 1', trigPin: 25, echoPin: 8 },
];

// ========================================
// UTILITY FUNCTIONS
// ========================================

export function isConnected(): Promise<boolean> {
  return getStatus()
    .then(() => true)
    .catch(() => false);
}

export function getApiBase(): string {
  return API_BASE;
}
