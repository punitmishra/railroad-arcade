// Railroad Arcade - API Client
// Connects to the Raspberry Pi control server

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ========================================
// TYPES
// ========================================
export interface TrackStatus {
  id: number;
  speed: number;
  direction: 'forward' | 'reverse' | 'stopped';
  active: boolean;
}

export interface SystemStatus {
  connected: boolean;
  tracks: TrackStatus[];
  cpx_connected: boolean;
  camera_active: boolean;
}

export interface SceneryState {
  time_of_day: 'day' | 'sunset' | 'night';
  lights: Record<string, boolean>;
  water: Record<string, boolean>;
}

// ========================================
// API FUNCTIONS
// ========================================

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  
  const data = await res.json();
  return data.data ?? data;
}

// System
export const getStatus = () => apiFetch<SystemStatus>('/api/status');
export const emergencyStop = () => apiFetch('/api/emergency-stop', { method: 'POST' });

// Tracks
export const getTracks = () => apiFetch<TrackStatus[]>('/api/tracks');
export const setTrackSpeed = (id: number, speed: number) => 
  apiFetch(`/api/tracks/${id}/speed`, { method: 'POST', body: JSON.stringify({ speed }) });
export const setTrackForward = (id: number) => 
  apiFetch(`/api/tracks/${id}/forward`, { method: 'POST' });
export const setTrackReverse = (id: number) => 
  apiFetch(`/api/tracks/${id}/reverse`, { method: 'POST' });
export const stopTrack = (id: number) => 
  apiFetch(`/api/tracks/${id}/stop`, { method: 'POST' });

// CPX
export const getCpxStatus = () => apiFetch('/api/cpx/status');
export const setGate = (position: 'up' | 'down') => 
  apiFetch(`/api/cpx/gate/${position}`, { method: 'POST' });
export const setServo = (num: number, angle: number) => 
  apiFetch(`/api/cpx/servo/${num}`, { method: 'POST', body: JSON.stringify({ angle }) });
export const playSound = (name: string) => 
  apiFetch(`/api/cpx/sound/${name}`, { method: 'POST' });
export const setLed = (color: string) => 
  apiFetch(`/api/cpx/led`, { method: 'POST', body: JSON.stringify({ color }) });

// Scenery
export const getScenery = () => apiFetch<SceneryState>('/api/scenery');
export const setScenery = (state: Partial<SceneryState>) => 
  apiFetch('/api/scenery', { method: 'POST', body: JSON.stringify(state) });

// Camera
export const getCameraStatus = () => apiFetch('/api/camera/status');
export const startCamera = () => apiFetch('/api/camera/start', { method: 'POST' });
export const stopCamera = () => apiFetch('/api/camera/stop', { method: 'POST' });

// Distance sensors
export const getDistances = () => apiFetch<Record<string, number>>('/api/distance');
export const getDistance = (sensor: string) => apiFetch<number>(`/api/distance/${sensor}`);

// Schedules
export const getSchedules = () => apiFetch('/api/schedules');
export const createSchedule = (schedule: any) => 
  apiFetch('/api/schedules', { method: 'POST', body: JSON.stringify(schedule) });
export const deleteSchedule = (id: number) => 
  apiFetch(`/api/schedules/${id}`, { method: 'DELETE' });

// ========================================
// DEFAULT CONFIGURATIONS
// ========================================

export const DEFAULT_LOCOMOTIVES = [
  { trackId: 1, name: 'Valley Runner', color: '#22c55e', level: 2, carts: 4 },
  { trackId: 2, name: 'City Limited', color: '#3b82f6', level: 2, carts: 6 },
  { trackId: 3, name: 'Mountain Express', color: '#a855f7', level: 1, carts: 3 },
];

export const DEFAULT_JUNCTIONS = [
  { id: 'J1', level: 1, name: 'Valley Junction' },
  { id: 'J2', level: 2, name: 'East Switch' },
  { id: 'J3', level: 2, name: 'West Switch' },
];

export const DEFAULT_CROSSINGS = [
  { id: 'X1', level: 1, name: 'Main Street Crossing' },
  { id: 'X2', level: 2, name: 'Oak Avenue' },
  { id: 'X3', level: 2, name: 'Pine Road' },
  { id: 'X4', level: 2, name: 'Maple Drive' },
  { id: 'X5', level: 2, name: 'Industrial Way' },
];

export const DEFAULT_STATIONS = [
  { id: 'S1', level: 2, name: 'Grand Central' },
  { id: 'S2', level: 1, name: 'Valley Station' },
];
