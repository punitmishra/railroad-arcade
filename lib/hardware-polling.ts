// ============================================
// Hardware Polling Service
// ============================================
// Polls the Raspberry Pi Rust backend for state changes
// and emits real-time events to connected clients.

import {
  emitHardwareState,
  emitSensorUpdate,
  emitCpxUpdate,
  emitCameraUpdate,
  HardwareStateData,
  SensorUpdateData,
  CpxUpdateData,
  CameraUpdateData,
} from './realtime';
import {
  getStatus,
  getCpxStatus,
  getCameraStatus,
  getDistances,
  SystemStatus,
  CpxStatus,
  CameraStatus,
  DistanceReading,
} from './api';

// Polling intervals (milliseconds)
const POLL_INTERVAL_STATUS = 1000; // Full system status
const POLL_INTERVAL_SENSORS = 500; // Faster sensor updates
const POLL_INTERVAL_CAMERA = 5000; // Camera status (less frequent)

// State tracking to detect changes
interface PollingState {
  lastStatus: SystemStatus | null;
  lastCpx: CpxStatus | null;
  lastCamera: CameraStatus | null;
  lastDistances: DistanceReading[] | null;
}

let pollingState: PollingState = {
  lastStatus: null,
  lastCpx: null,
  lastCamera: null,
  lastDistances: null,
};

let isPolling = false;
let statusInterval: NodeJS.Timeout | null = null;
let sensorInterval: NodeJS.Timeout | null = null;
let cameraInterval: NodeJS.Timeout | null = null;

// Track connected clients
let clientCount = 0;

/**
 * Check if system status has changed
 */
function hasStatusChanged(
  prev: SystemStatus | null,
  curr: SystemStatus
): boolean {
  if (!prev) return true;
  if (prev.controller !== curr.controller) return true;
  if (prev.cpx !== curr.cpx) return true;
  if (prev.camera !== curr.camera) return true;

  // Check tracks
  if (prev.tracks.length !== curr.tracks.length) return true;
  for (let i = 0; i < curr.tracks.length; i++) {
    const pt = prev.tracks[i];
    const ct = curr.tracks[i];
    if (!pt || pt.id !== ct.id) return true;
    if (pt.speed !== ct.speed) return true;
    if (pt.direction !== ct.direction) return true;
    if (pt.running !== ct.running) return true;
  }

  return false;
}

/**
 * Check if CPX status has changed
 */
function hasCpxChanged(prev: CpxStatus | null, curr: CpxStatus): boolean {
  if (!prev) return true;
  if (prev.connected !== curr.connected) return true;
  if (prev.gate !== curr.gate) return true;
  if (prev.auto_gate !== curr.auto_gate) return true;

  // Check servos
  for (let i = 0; i < 4; i++) {
    if (prev.servos[i] !== curr.servos[i]) return true;
  }

  // Check LDR
  for (let i = 0; i < 3; i++) {
    if (prev.ldr_blocked[i] !== curr.ldr_blocked[i]) return true;
    // Only emit on significant LDR value change (>10)
    if (Math.abs(prev.ldr_raw[i] - curr.ldr_raw[i]) > 10) return true;
  }

  return false;
}

/**
 * Check if distance sensors have changed
 */
function hasDistancesChanged(
  prev: DistanceReading[] | null,
  curr: DistanceReading[]
): boolean {
  if (!prev) return true;
  if (prev.length !== curr.length) return true;

  for (let i = 0; i < curr.length; i++) {
    const ps = prev.find((s) => s.name === curr[i].name);
    if (!ps) return true;
    if (ps.blocked !== curr[i].blocked) return true;
    // Only emit on significant distance change (>5cm)
    if (Math.abs(ps.distance_cm - curr[i].distance_cm) > 5) return true;
  }

  return false;
}

/**
 * Poll system status and emit events
 */
async function pollStatus(): Promise<void> {
  try {
    const status = await getStatus();

    if (hasStatusChanged(pollingState.lastStatus, status)) {
      const hardwareState: HardwareStateData = {
        controllerOnline: status.controller,
        cpxConnected: status.cpx,
        cameraRunning: status.camera,
        tracks: status.tracks.map((t) => ({
          id: t.id,
          speed: t.speed,
          direction: t.direction,
          running: t.running,
        })),
        lastUpdated: Date.now(),
      };

      emitHardwareState(hardwareState);
      pollingState.lastStatus = status;
    }
  } catch (error) {
    // Emit offline state
    if (pollingState.lastStatus?.controller !== false) {
      emitHardwareState({
        controllerOnline: false,
        cpxConnected: false,
        cameraRunning: false,
        tracks: [],
        lastUpdated: Date.now(),
      });
      pollingState.lastStatus = null;
    }
  }
}

/**
 * Poll sensors and emit events
 */
async function pollSensors(): Promise<void> {
  try {
    // Poll distance sensors
    const distances = await getDistances();

    if (hasDistancesChanged(pollingState.lastDistances, distances)) {
      const sensorData: SensorUpdateData = {
        type: 'distance',
        sensors: distances.map((d) => ({
          name: d.name,
          value: d.distance_cm,
          blocked: d.blocked,
        })),
      };

      emitSensorUpdate(sensorData);
      pollingState.lastDistances = distances;
    }

    // Poll CPX (includes LDR sensors)
    const cpx = await getCpxStatus();

    if (hasCpxChanged(pollingState.lastCpx, cpx)) {
      const cpxData: CpxUpdateData = {
        connected: cpx.connected,
        servos: cpx.servos,
        ldrRaw: cpx.ldr_raw,
        ldrBlocked: cpx.ldr_blocked,
        gate: cpx.gate,
        autoGate: cpx.auto_gate,
      };

      emitCpxUpdate(cpxData);

      // Also emit LDR as sensor update
      const ldrData: SensorUpdateData = {
        type: 'ldr',
        sensors: cpx.ldr_raw.map((value, i) => ({
          name: `ldr${i + 1}`,
          value,
          blocked: cpx.ldr_blocked[i],
        })),
      };

      emitSensorUpdate(ldrData);
      pollingState.lastCpx = cpx;
    }
  } catch (error) {
    // Silently handle sensor poll failures
  }
}

/**
 * Poll camera status and emit events
 */
async function pollCamera(): Promise<void> {
  try {
    const camera = await getCameraStatus();

    if (
      !pollingState.lastCamera ||
      pollingState.lastCamera.running !== camera.running ||
      pollingState.lastCamera.stream_url !== camera.stream_url
    ) {
      const cameraData: CameraUpdateData = {
        running: camera.running,
        streamUrl: camera.stream_url,
      };

      emitCameraUpdate(cameraData);
      pollingState.lastCamera = camera;
    }
  } catch (error) {
    // Emit camera offline if it was previously online
    if (pollingState.lastCamera?.running) {
      emitCameraUpdate({ running: false });
      pollingState.lastCamera = null;
    }
  }
}

/**
 * Start hardware polling
 */
export function startHardwarePolling(): void {
  if (isPolling) return;

  console.log('[HardwarePolling] Starting hardware polling service');
  isPolling = true;

  // Initial poll
  pollStatus();
  pollSensors();
  pollCamera();

  // Set up intervals
  statusInterval = setInterval(pollStatus, POLL_INTERVAL_STATUS);
  sensorInterval = setInterval(pollSensors, POLL_INTERVAL_SENSORS);
  cameraInterval = setInterval(pollCamera, POLL_INTERVAL_CAMERA);
}

/**
 * Stop hardware polling
 */
export function stopHardwarePolling(): void {
  if (!isPolling) return;

  console.log('[HardwarePolling] Stopping hardware polling service');
  isPolling = false;

  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
  if (sensorInterval) {
    clearInterval(sensorInterval);
    sensorInterval = null;
  }
  if (cameraInterval) {
    clearInterval(cameraInterval);
    cameraInterval = null;
  }

  // Reset state
  pollingState = {
    lastStatus: null,
    lastCpx: null,
    lastCamera: null,
    lastDistances: null,
  };
}

/**
 * Register a client - starts polling if first client
 */
export function registerPollingClient(): void {
  clientCount++;
  console.log(`[HardwarePolling] Client connected (total: ${clientCount})`);

  if (clientCount === 1) {
    startHardwarePolling();
  }
}

/**
 * Unregister a client - stops polling if no clients remain
 */
export function unregisterPollingClient(): void {
  clientCount = Math.max(0, clientCount - 1);
  console.log(`[HardwarePolling] Client disconnected (total: ${clientCount})`);

  if (clientCount === 0) {
    stopHardwarePolling();
  }
}

/**
 * Get current polling status
 */
export function getPollingStatus(): {
  isPolling: boolean;
  clientCount: number;
  lastStatus: SystemStatus | null;
} {
  return {
    isPolling,
    clientCount,
    lastStatus: pollingState.lastStatus,
  };
}

/**
 * Force an immediate poll (for testing or manual refresh)
 */
export async function forcePoll(): Promise<void> {
  await Promise.all([pollStatus(), pollSensors(), pollCamera()]);
}
