// ============================================
// Live Adapter - Raspberry Pi Hardware Control
// ============================================
// This adapter connects to the real Raspberry Pi
// Rust backend and sends commands to control trains.

import {
  HardwareAdapter,
  TrainState,
  TrainDirection,
  JunctionState,
  CrossingState,
  SignalState,
  SceneryState,
  SystemStatus,
  LayoutState,
  DEFAULT_TRAINS,
  DEFAULT_JUNCTIONS,
  DEFAULT_CROSSINGS,
  DEFAULT_SIGNALS,
  DEFAULT_SCENERY,
} from './HardwareAdapter';
import * as api from '../api';

export class LiveAdapter implements HardwareAdapter {
  private trains: TrainState[];
  private junctions: JunctionState[];
  private crossings: CrossingState[];
  private signals: SignalState[];
  private scenery: SceneryState;
  private subscribers: Set<(state: LayoutState) => void>;
  private pollInterval: NodeJS.Timeout | null;
  private lastSystemStatus: SystemStatus;
  private cpxStatus: api.CpxStatus | null;
  private distanceReadings: api.DistanceReading[];

  constructor() {
    // Initialize with default state (will be updated from hardware)
    this.trains = JSON.parse(JSON.stringify(DEFAULT_TRAINS));
    this.junctions = JSON.parse(JSON.stringify(DEFAULT_JUNCTIONS));
    this.crossings = JSON.parse(JSON.stringify(DEFAULT_CROSSINGS));
    this.signals = JSON.parse(JSON.stringify(DEFAULT_SIGNALS));
    this.scenery = { ...DEFAULT_SCENERY };
    this.subscribers = new Set();
    this.pollInterval = null;
    this.cpxStatus = null;
    this.distanceReadings = [];
    this.lastSystemStatus = {
      connected: false,
      tracksOnline: 0,
      cameraOnline: false,
      cpxOnline: false,
      lastUpdate: 0,
    };

    // Start polling for state updates
    this.startPolling();
  }

  // ============================================
  // System
  // ============================================

  async getStatus(): Promise<SystemStatus> {
    try {
      const status = await api.getStatus();

      // Update CPX status if available
      if (status.cpx_status) {
        this.cpxStatus = status.cpx_status;
      }

      // Update distance readings
      if (status.distances) {
        this.distanceReadings = status.distances;
      }

      this.lastSystemStatus = {
        connected: true,
        tracksOnline: status.tracks?.filter((t) => t.running).length ?? 0,
        cameraOnline: status.camera ?? false,
        cpxOnline: status.cpx ?? false,
        lastUpdate: Date.now(),
      };
      return this.lastSystemStatus;
    } catch (error) {
      this.lastSystemStatus = {
        connected: false,
        tracksOnline: 0,
        cameraOnline: false,
        cpxOnline: false,
        lastUpdate: Date.now(),
      };
      return this.lastSystemStatus;
    }
  }

  async emergencyStop(): Promise<void> {
    await api.emergencyStop();
    // Update local state immediately
    this.trains = this.trains.map((train) => ({
      ...train,
      speed: 0,
      direction: 'stopped' as TrainDirection,
    }));
    this.notifySubscribers();
  }

  // ============================================
  // Train Control
  // ============================================

  async getTrains(): Promise<TrainState[]> {
    try {
      const tracks = await api.getTracks();
      // Merge API response with default train info
      this.trains = this.trains.map((train) => {
        const trackData = tracks.find((t) => t.id === train.trackId);
        if (trackData) {
          return {
            ...train,
            speed: trackData.speed,
            direction: this.mapDirection(trackData.direction),
          };
        }
        return train;
      });
      return [...this.trains];
    } catch (error) {
      console.error('Failed to get trains:', error);
      return [...this.trains];
    }
  }

  private mapDirection(dir: api.Direction): TrainDirection {
    switch (dir) {
      case 'forward':
        return 'forward';
      case 'reverse':
        return 'reverse';
      case 'stop':
      default:
        return 'stopped';
    }
  }

  async setTrainSpeed(trackId: string, speed: number): Promise<void> {
    const clampedSpeed = Math.max(0, Math.min(100, speed));
    await api.setTrackSpeed(trackId, clampedSpeed);

    // Update local state
    this.trains = this.trains.map((train) =>
      train.trackId === trackId
        ? {
            ...train,
            speed: clampedSpeed,
            direction:
              clampedSpeed > 0
                ? train.direction === 'stopped'
                  ? 'forward'
                  : train.direction
                : 'stopped',
          }
        : train
    );
    this.notifySubscribers();
  }

  async setTrainDirection(trackId: string, direction: TrainDirection): Promise<void> {
    if (direction === 'forward') {
      await api.setTrackForward(trackId);
    } else if (direction === 'reverse') {
      await api.setTrackReverse(trackId);
    } else {
      await api.stopTrack(trackId);
    }

    // Update local state
    this.trains = this.trains.map((train) =>
      train.trackId === trackId ? { ...train, direction } : train
    );
    this.notifySubscribers();
  }

  async stopTrain(trackId: string): Promise<void> {
    await api.stopTrack(trackId);

    // Update local state
    this.trains = this.trains.map((train) =>
      train.trackId === trackId
        ? { ...train, speed: 0, direction: 'stopped' as TrainDirection }
        : train
    );
    this.notifySubscribers();
  }

  async toggleHeadlights(trackId: string): Promise<void> {
    // Headlights controlled via LED API
    const train = this.trains.find((t) => t.trackId === trackId);
    if (train) {
      const newState = !train.headlights;
      // Map train to LED color (green for on, off for off)
      if (newState) {
        await api.setLed('white').catch(() => {});
      }
      this.trains = this.trains.map((t) =>
        t.trackId === trackId ? { ...t, headlights: newState } : t
      );
      this.notifySubscribers();
    }
  }

  // ============================================
  // Junction Control
  // ============================================

  async getJunctions(): Promise<JunctionState[]> {
    // Update junction state from CPX servo positions if available
    if (this.cpxStatus) {
      this.junctions = this.junctions.map((junction, idx) => {
        const servoAngle = this.cpxStatus!.servos[idx + 1]; // Servos 2-4 for junctions
        return {
          ...junction,
          position: servoAngle > 20 ? 'diverge' : 'straight',
        };
      });
    }
    return [...this.junctions];
  }

  async toggleJunction(id: string): Promise<void> {
    const junction = this.junctions.find((j) => j.id === id);
    if (junction) {
      const newPosition = junction.position === 'straight' ? 'diverge' : 'straight';
      const servoNum = this.getServoForJunction(id);
      const angle = newPosition === 'straight' ? 0 : 45;

      await api.setServo(servoNum, angle);

      this.junctions = this.junctions.map((j) =>
        j.id === id ? { ...j, position: newPosition } : j
      );
      this.notifySubscribers();
    }
  }

  async setJunctionPosition(id: string, position: 'straight' | 'diverge'): Promise<void> {
    const servoNum = this.getServoForJunction(id);
    const angle = position === 'straight' ? 0 : 45;

    await api.setServo(servoNum, angle);

    this.junctions = this.junctions.map((j) =>
      j.id === id ? { ...j, position } : j
    );
    this.notifySubscribers();
  }

  private getServoForJunction(id: string): number {
    // Map junction IDs to servo numbers (servos 2-4)
    const mapping: Record<string, number> = {
      J1: 2,
      J2: 3,
      J3: 4,
    };
    return mapping[id] ?? 2;
  }

  // ============================================
  // Crossing Control
  // ============================================

  async getCrossings(): Promise<CrossingState[]> {
    // Update crossing state from CPX gate position
    if (this.cpxStatus) {
      this.crossings = this.crossings.map((crossing) => {
        if (crossing.id === 'X1') {
          // Main crossing uses servo 1 / gate
          return {
            ...crossing,
            gatePosition: this.cpxStatus!.gate,
            isOpen: this.cpxStatus!.gate === 'up',
          };
        }
        return crossing;
      });
    }
    return [...this.crossings];
  }

  async toggleCrossing(id: string): Promise<void> {
    const crossing = this.crossings.find((c) => c.id === id);
    if (crossing) {
      const newPosition = crossing.gatePosition === 'up' ? 'down' : 'up';
      await api.setGate(newPosition);

      this.crossings = this.crossings.map((c) =>
        c.id === id
          ? { ...c, gatePosition: newPosition, isOpen: newPosition === 'up' }
          : c
      );
      this.notifySubscribers();
    }
  }

  async setCrossingGate(id: string, position: 'up' | 'down'): Promise<void> {
    await api.setGate(position);

    this.crossings = this.crossings.map((c) =>
      c.id === id ? { ...c, gatePosition: position, isOpen: position === 'up' } : c
    );
    this.notifySubscribers();
  }

  // ============================================
  // Signals
  // ============================================

  async getSignals(): Promise<SignalState[]> {
    // Signals are computed based on train positions and distance sensors
    if (this.distanceReadings.length > 0) {
      this.signals = this.signals.map((signal) => {
        const sensor = this.distanceReadings.find(
          (d) => d.name === `signal_${signal.id.toLowerCase()}`
        );
        if (sensor) {
          return {
            ...signal,
            state: sensor.blocked ? 'red' : 'green',
          };
        }
        return signal;
      });
    }
    return [...this.signals];
  }

  // ============================================
  // Distance Sensors
  // ============================================

  async getDistanceReadings(): Promise<api.DistanceReading[]> {
    try {
      this.distanceReadings = await api.getDistances();
      return this.distanceReadings;
    } catch (error) {
      console.error('Failed to get distance readings:', error);
      return this.distanceReadings;
    }
  }

  // ============================================
  // Scenery
  // ============================================

  async getScenery(): Promise<SceneryState> {
    try {
      const sceneryData = await api.getScenery();
      this.scenery = {
        timeOfDay: sceneryData.time_of_day,
        weather: 'clear',
        season: 'summer',
        lightsOn:
          sceneryData.lighting.residential ||
          sceneryData.lighting.entertainment ||
          sceneryData.lighting.streets,
      };
      return { ...this.scenery };
    } catch (error) {
      console.error('Failed to get scenery:', error);
      return { ...this.scenery };
    }
  }

  async setScenery(scenery: Partial<SceneryState>): Promise<void> {
    const apiScenery: Partial<api.SceneryState> = {};

    if (scenery.timeOfDay) {
      apiScenery.time_of_day =
        scenery.timeOfDay === 'sunrise' ? 'day' : (scenery.timeOfDay as 'day' | 'sunset' | 'night');
    }

    if (scenery.lightsOn !== undefined) {
      apiScenery.lighting = {
        residential: scenery.lightsOn,
        entertainment: scenery.lightsOn,
        station1: scenery.lightsOn,
        station2: scenery.lightsOn,
        parking: scenery.lightsOn,
        tunnels: scenery.lightsOn,
        streets: scenery.lightsOn,
      };
    }

    await api.setScenery(apiScenery);

    this.scenery = { ...this.scenery, ...scenery };
    this.notifySubscribers();
  }

  // ============================================
  // Sound
  // ============================================

  async playSound(name: string): Promise<void> {
    await api.playSound(name);
  }

  // ============================================
  // Camera
  // ============================================

  async startCamera(): Promise<api.CameraStatus> {
    return api.startCamera();
  }

  async stopCamera(): Promise<api.CameraStatus> {
    return api.stopCamera();
  }

  async getCameraStatus(): Promise<api.CameraStatus> {
    return api.getCameraStatus();
  }

  // ============================================
  // CPX
  // ============================================

  async getCpxStatus(): Promise<api.CpxStatus | null> {
    try {
      this.cpxStatus = await api.getCpxStatus();
      return this.cpxStatus;
    } catch {
      return null;
    }
  }

  async calibrateServos(): Promise<void> {
    await api.calibrateServos();
  }

  async getCpxTemperature(): Promise<number | null> {
    try {
      return await api.getCpxTemperature();
    } catch {
      return null;
    }
  }

  // ============================================
  // Automation
  // ============================================

  async getSequences(): Promise<api.AutomationSequence[]> {
    return api.getSequences();
  }

  async runSequence(id: string): Promise<void> {
    await api.runSequence(id);
  }

  // ============================================
  // Schedules
  // ============================================

  async getSchedules(): Promise<api.Schedule[]> {
    return api.getSchedules();
  }

  async createSchedule(schedule: Omit<api.Schedule, 'id'>): Promise<api.Schedule> {
    return api.createSchedule(schedule);
  }

  async deleteSchedule(id: number): Promise<void> {
    await api.deleteSchedule(id);
  }

  // ============================================
  // Subscription
  // ============================================

  subscribe(callback: (state: LayoutState) => void): () => void {
    this.subscribers.add(callback);
    // Immediately send current state
    callback(this.getLayoutState());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const state = this.getLayoutState();
    this.subscribers.forEach((callback) => callback(state));
  }

  private getLayoutState(): LayoutState {
    return {
      trains: this.trains,
      junctions: this.junctions,
      crossings: this.crossings,
      signals: this.signals,
      scenery: this.scenery,
      system: this.lastSystemStatus,
    };
  }

  // ============================================
  // Polling for State Updates
  // ============================================

  private startPolling(): void {
    // Poll for updates every 1000ms when there are subscribers
    this.pollInterval = setInterval(async () => {
      if (this.subscribers.size > 0) {
        await this.refreshState();
      }
    }, 1000);
  }

  private async refreshState(): Promise<void> {
    try {
      await Promise.all([this.getStatus(), this.getTrains()]);
      this.notifySubscribers();
    } catch (error) {
      // Connection failed, update status
      this.lastSystemStatus = {
        ...this.lastSystemStatus,
        connected: false,
        lastUpdate: Date.now(),
      };
      this.notifySubscribers();
    }
  }

  // ============================================
  // Cleanup
  // ============================================

  destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.subscribers.clear();
  }
}

// ============================================
// Singleton Instance
// ============================================

let liveAdapterInstance: LiveAdapter | null = null;

export function getLiveAdapter(): LiveAdapter {
  if (!liveAdapterInstance) {
    liveAdapterInstance = new LiveAdapter();
  }
  return liveAdapterInstance;
}

export function resetLiveAdapter(): void {
  if (liveAdapterInstance) {
    liveAdapterInstance.destroy();
    liveAdapterInstance = null;
  }
}
