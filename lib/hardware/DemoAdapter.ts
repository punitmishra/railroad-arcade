// ============================================
// Demo Adapter - Client-Side Simulation
// ============================================
// This adapter runs entirely in the browser with no
// backend connection. Perfect for demo mode where
// users can play without tokens.

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

export class DemoAdapter implements HardwareAdapter {
  private trains: TrainState[];
  private junctions: JunctionState[];
  private crossings: CrossingState[];
  private signals: SignalState[];
  private scenery: SceneryState;
  private subscribers: Set<(state: LayoutState) => void>;
  private animationFrame: number | null;
  private lastUpdate: number;

  constructor() {
    // Initialize with default state
    this.trains = JSON.parse(JSON.stringify(DEFAULT_TRAINS));
    this.junctions = JSON.parse(JSON.stringify(DEFAULT_JUNCTIONS));
    this.crossings = JSON.parse(JSON.stringify(DEFAULT_CROSSINGS));
    this.signals = JSON.parse(JSON.stringify(DEFAULT_SIGNALS));
    this.scenery = { ...DEFAULT_SCENERY };
    this.subscribers = new Set();
    this.animationFrame = null;
    this.lastUpdate = Date.now();

    // Start simulation loop
    this.startSimulation();
  }

  // ============================================
  // System
  // ============================================

  async getStatus(): Promise<SystemStatus> {
    return {
      connected: true, // Demo is always "connected"
      tracksOnline: 3,
      cameraOnline: true,
      cpxOnline: true,
      lastUpdate: Date.now(),
    };
  }

  async emergencyStop(): Promise<void> {
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
    return [...this.trains];
  }

  async setTrainSpeed(trackId: number, speed: number): Promise<void> {
    const clampedSpeed = Math.max(0, Math.min(100, speed));
    this.trains = this.trains.map((train) =>
      train.trackId === trackId
        ? {
            ...train,
            speed: clampedSpeed,
            direction: clampedSpeed > 0 ? (train.direction === 'stopped' ? 'forward' : train.direction) : 'stopped',
          }
        : train
    );
    this.notifySubscribers();
  }

  async setTrainDirection(trackId: number, direction: TrainDirection): Promise<void> {
    this.trains = this.trains.map((train) =>
      train.trackId === trackId ? { ...train, direction } : train
    );
    this.notifySubscribers();
  }

  async stopTrain(trackId: number): Promise<void> {
    await this.setTrainSpeed(trackId, 0);
    await this.setTrainDirection(trackId, 'stopped');
  }

  async toggleHeadlights(trackId: number): Promise<void> {
    this.trains = this.trains.map((train) =>
      train.trackId === trackId ? { ...train, headlights: !train.headlights } : train
    );
    this.notifySubscribers();
  }

  // ============================================
  // Junction Control
  // ============================================

  async getJunctions(): Promise<JunctionState[]> {
    return [...this.junctions];
  }

  async toggleJunction(id: string): Promise<void> {
    this.junctions = this.junctions.map((junction) =>
      junction.id === id
        ? { ...junction, position: junction.position === 'straight' ? 'diverge' : 'straight' }
        : junction
    );
    this.notifySubscribers();
  }

  async setJunctionPosition(id: string, position: 'straight' | 'diverge'): Promise<void> {
    this.junctions = this.junctions.map((junction) =>
      junction.id === id ? { ...junction, position } : junction
    );
    this.notifySubscribers();
  }

  // ============================================
  // Crossing Control
  // ============================================

  async getCrossings(): Promise<CrossingState[]> {
    return [...this.crossings];
  }

  async toggleCrossing(id: string): Promise<void> {
    this.crossings = this.crossings.map((crossing) =>
      crossing.id === id
        ? {
            ...crossing,
            isOpen: !crossing.isOpen,
            gatePosition: crossing.isOpen ? 'down' : 'up',
          }
        : crossing
    );
    this.notifySubscribers();
  }

  async setCrossingGate(id: string, position: 'up' | 'down'): Promise<void> {
    this.crossings = this.crossings.map((crossing) =>
      crossing.id === id
        ? { ...crossing, gatePosition: position, isOpen: position === 'up' }
        : crossing
    );
    this.notifySubscribers();
  }

  // ============================================
  // Signals
  // ============================================

  async getSignals(): Promise<SignalState[]> {
    return [...this.signals];
  }

  // ============================================
  // Scenery
  // ============================================

  async getScenery(): Promise<SceneryState> {
    return { ...this.scenery };
  }

  async setScenery(scenery: Partial<SceneryState>): Promise<void> {
    this.scenery = { ...this.scenery, ...scenery };
    this.notifySubscribers();
  }

  // ============================================
  // Sound
  // ============================================

  async playSound(name: string): Promise<void> {
    // In demo mode, we could play sounds via Web Audio API
    console.log(`[Demo] Playing sound: ${name}`);
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
      system: {
        connected: true,
        tracksOnline: 3,
        cameraOnline: true,
        cpxOnline: true,
        lastUpdate: Date.now(),
      },
    };
  }

  // ============================================
  // Simulation Loop
  // ============================================

  private startSimulation(): void {
    const simulate = () => {
      const now = Date.now();
      const deltaTime = (now - this.lastUpdate) / 1000; // seconds
      this.lastUpdate = now;

      // Update train positions
      this.trains = this.trains.map((train) => {
        if (train.speed === 0 || train.direction === 'stopped') {
          return train;
        }

        // Calculate position change based on speed
        // Speed is in km/h, track is normalized 0-1
        // Assume full track is ~1km, so speed/3600 gives position change per second
        const speedFactor = train.speed / 3600;
        const directionMultiplier = train.direction === 'reverse' ? -1 : 1;
        let newPosition = train.position + speedFactor * deltaTime * directionMultiplier * 10;

        // Wrap position around track
        if (newPosition > 1) newPosition -= 1;
        if (newPosition < 0) newPosition += 1;

        return { ...train, position: newPosition };
      });

      // Update signals based on train proximity
      this.updateSignals();

      // Notify subscribers
      this.notifySubscribers();

      this.animationFrame = requestAnimationFrame(simulate);
    };

    this.animationFrame = requestAnimationFrame(simulate);
  }

  private updateSignals(): void {
    // Simple signal logic based on train positions
    this.signals = this.signals.map((signal, index) => {
      const signalPosition = (index * 0.15) % 1;
      const signalLevel = signal.level;

      // Check if any train is near this signal
      let nearestDistance = Infinity;
      for (const train of this.trains) {
        if (train.level === signalLevel && train.speed > 0) {
          const distance = Math.min(
            Math.abs(train.position - signalPosition),
            Math.abs(train.position - signalPosition + 1),
            Math.abs(train.position - signalPosition - 1)
          );
          nearestDistance = Math.min(nearestDistance, distance);
        }
      }

      let color: 'green' | 'yellow' | 'red';
      if (nearestDistance < 0.05) {
        color = 'red';
      } else if (nearestDistance < 0.15) {
        color = 'yellow';
      } else {
        color = 'green';
      }

      return { ...signal, color };
    });
  }

  // ============================================
  // Cleanup
  // ============================================

  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.subscribers.clear();
  }
}

// ============================================
// Singleton Instance
// ============================================

let demoAdapterInstance: DemoAdapter | null = null;

export function getDemoAdapter(): DemoAdapter {
  if (!demoAdapterInstance) {
    demoAdapterInstance = new DemoAdapter();
  }
  return demoAdapterInstance;
}

export function resetDemoAdapter(): void {
  if (demoAdapterInstance) {
    demoAdapterInstance.destroy();
    demoAdapterInstance = null;
  }
}
