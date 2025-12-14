// ============================================
// Live Adapter - Raspberry Pi Hardware Control
// ============================================
// This adapter connects to the real Raspberry Pi
// hardware and sends commands to control trains.

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
  private apiBase: string;
  private trains: TrainState[];
  private junctions: JunctionState[];
  private crossings: CrossingState[];
  private signals: SignalState[];
  private scenery: SceneryState;
  private subscribers: Set<(state: LayoutState) => void>;
  private pollInterval: NodeJS.Timeout | null;
  private lastSystemStatus: SystemStatus;

  constructor() {
    this.apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Initialize with default state (will be updated from hardware)
    this.trains = JSON.parse(JSON.stringify(DEFAULT_TRAINS));
    this.junctions = JSON.parse(JSON.stringify(DEFAULT_JUNCTIONS));
    this.crossings = JSON.parse(JSON.stringify(DEFAULT_CROSSINGS));
    this.signals = JSON.parse(JSON.stringify(DEFAULT_SIGNALS));
    this.scenery = { ...DEFAULT_SCENERY };
    this.subscribers = new Set();
    this.pollInterval = null;
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
      this.lastSystemStatus = {
        connected: true,
        tracksOnline: status.tracks?.filter((t) => t.active).length ?? 0,
        cameraOnline: status.camera_active ?? false,
        cpxOnline: status.cpx_connected ?? false,
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
            direction: trackData.direction,
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

  async setTrainSpeed(trackId: number, speed: number): Promise<void> {
    const clampedSpeed = Math.max(0, Math.min(100, speed));
    await api.setTrackSpeed(trackId, clampedSpeed);

    // Update local state
    this.trains = this.trains.map((train) =>
      train.trackId === trackId
        ? {
            ...train,
            speed: clampedSpeed,
            direction: clampedSpeed > 0
              ? (train.direction === 'stopped' ? 'forward' : train.direction)
              : 'stopped',
          }
        : train
    );
    this.notifySubscribers();
  }

  async setTrainDirection(trackId: number, direction: TrainDirection): Promise<void> {
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

  async stopTrain(trackId: number): Promise<void> {
    await api.stopTrack(trackId);

    // Update local state
    this.trains = this.trains.map((train) =>
      train.trackId === trackId
        ? { ...train, speed: 0, direction: 'stopped' as TrainDirection }
        : train
    );
    this.notifySubscribers();
  }

  async toggleHeadlights(trackId: number): Promise<void> {
    // Headlights might be controlled via LED API or separate endpoint
    // For now, just update local state
    this.trains = this.trains.map((train) =>
      train.trackId === trackId ? { ...train, headlights: !train.headlights } : train
    );
    this.notifySubscribers();
  }

  // ============================================
  // Junction Control
  // ============================================

  async getJunctions(): Promise<JunctionState[]> {
    // API may not have junction state, return local state
    return [...this.junctions];
  }

  async toggleJunction(id: string): Promise<void> {
    // Junctions are controlled via servo API
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
    // Map junction IDs to servo numbers
    const mapping: Record<string, number> = {
      'J1': 1,
      'J2': 2,
      'J3': 3,
    };
    return mapping[id] ?? 1;
  }

  // ============================================
  // Crossing Control
  // ============================================

  async getCrossings(): Promise<CrossingState[]> {
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
    // Signals are typically read-only, computed based on train positions
    return [...this.signals];
  }

  // ============================================
  // Scenery
  // ============================================

  async getScenery(): Promise<SceneryState> {
    try {
      const sceneryData = await api.getScenery();
      // Map API response to our format
      this.scenery = {
        timeOfDay: sceneryData.time_of_day === 'day' ? 'day'
          : sceneryData.time_of_day === 'sunset' ? 'sunset'
          : sceneryData.time_of_day === 'night' ? 'night'
          : 'day',
        weather: 'clear', // API may not have weather
        season: 'summer', // API may not have season
        lightsOn: Object.values(sceneryData.lights || {}).some((v) => v),
      };
      return { ...this.scenery };
    } catch (error) {
      console.error('Failed to get scenery:', error);
      return { ...this.scenery };
    }
  }

  async setScenery(scenery: Partial<SceneryState>): Promise<void> {
    // Map our format to API format
    const apiScenery: Partial<api.SceneryState> = {};

    if (scenery.timeOfDay) {
      apiScenery.time_of_day = scenery.timeOfDay === 'sunrise' ? 'day' : scenery.timeOfDay as 'day' | 'sunset' | 'night';
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
    // Poll for updates every 500ms when there are subscribers
    this.pollInterval = setInterval(async () => {
      if (this.subscribers.size > 0) {
        await this.refreshState();
      }
    }, 500);
  }

  private async refreshState(): Promise<void> {
    try {
      await Promise.all([
        this.getStatus(),
        this.getTrains(),
      ]);
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to refresh state:', error);
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
