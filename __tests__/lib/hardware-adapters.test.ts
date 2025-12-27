/**
 * Hardware Adapters Unit Tests
 */

import { DemoAdapter, getDemoAdapter, resetDemoAdapter } from '@/lib/hardware/DemoAdapter';
import { HardwareAdapter } from '@/lib/hardware/HardwareAdapter';

// Mock requestAnimationFrame for DemoAdapter
global.requestAnimationFrame = jest.fn((cb) => {
  return setTimeout(cb, 16) as unknown as number;
});
global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

describe('DemoAdapter', () => {
  let adapter: DemoAdapter;

  beforeEach(() => {
    resetDemoAdapter();
    adapter = getDemoAdapter();
  });

  afterEach(() => {
    adapter.destroy();
    jest.clearAllMocks();
  });

  describe('System Status', () => {
    it('should return connected status', async () => {
      const status = await adapter.getStatus();
      expect(status.connected).toBe(true);
    });

    it('should return tracks online count', async () => {
      const status = await adapter.getStatus();
      expect(status.tracksOnline).toBe(3);
    });

    it('should return camera and cpx online', async () => {
      const status = await adapter.getStatus();
      expect(status.cameraOnline).toBe(true);
      expect(status.cpxOnline).toBe(true);
    });

    it('should have lastUpdate timestamp', async () => {
      const before = Date.now();
      const status = await adapter.getStatus();
      const after = Date.now();
      expect(status.lastUpdate).toBeGreaterThanOrEqual(before);
      expect(status.lastUpdate).toBeLessThanOrEqual(after);
    });
  });

  describe('Train Control', () => {
    it('should get all trains', async () => {
      const trains = await adapter.getTrains();
      expect(trains.length).toBeGreaterThan(0);
      trains.forEach(train => {
        expect(train).toHaveProperty('trackId');
        expect(train).toHaveProperty('speed');
        expect(train).toHaveProperty('direction');
        expect(train).toHaveProperty('name');
      });
    });

    it('should set train speed', async () => {
      await adapter.setTrainSpeed('1', 50);
      const trains = await adapter.getTrains();
      const train = trains.find(t => t.trackId === '1');
      expect(train?.speed).toBe(50);
    });

    it('should clamp speed to valid range (0-100)', async () => {
      await adapter.setTrainSpeed('1', 150);
      let trains = await adapter.getTrains();
      let train = trains.find(t => t.trackId === '1');
      expect(train?.speed).toBeLessThanOrEqual(100);

      await adapter.setTrainSpeed('1', -50);
      trains = await adapter.getTrains();
      train = trains.find(t => t.trackId === '1');
      expect(train?.speed).toBeGreaterThanOrEqual(0);
    });

    it('should set train direction', async () => {
      await adapter.setTrainDirection('1', 'reverse');
      const trains = await adapter.getTrains();
      const train = trains.find(t => t.trackId === '1');
      expect(train?.direction).toBe('reverse');
    });

    it('should stop train', async () => {
      await adapter.setTrainSpeed('1', 50);
      await adapter.stopTrain('1');
      const trains = await adapter.getTrains();
      const train = trains.find(t => t.trackId === '1');
      expect(train?.speed).toBe(0);
      expect(train?.direction).toBe('stopped');
    });

    it('should handle emergency stop', async () => {
      await adapter.setTrainSpeed('1', 50);
      await adapter.setTrainSpeed('2', 75);
      await adapter.emergencyStop();

      const trains = await adapter.getTrains();
      trains.forEach(train => {
        expect(train.speed).toBe(0);
      });
    });

    it('should toggle headlights', async () => {
      const trainsBefore = await adapter.getTrains();
      const headlightsBefore = trainsBefore.find(t => t.trackId === '1')?.headlights;

      await adapter.toggleHeadlights('1');

      const trainsAfter = await adapter.getTrains();
      const headlightsAfter = trainsAfter.find(t => t.trackId === '1')?.headlights;

      expect(headlightsAfter).toBe(!headlightsBefore);
    });
  });

  describe('Junction Control', () => {
    it('should get all junctions', async () => {
      const junctions = await adapter.getJunctions();
      expect(junctions.length).toBeGreaterThan(0);
      junctions.forEach(junction => {
        expect(junction).toHaveProperty('id');
        expect(junction).toHaveProperty('name');
        expect(junction).toHaveProperty('position');
      });
    });

    it('should toggle junction position', async () => {
      const junctionsBefore = await adapter.getJunctions();
      const positionBefore = junctionsBefore.find(j => j.id === 'J1')?.position;

      await adapter.toggleJunction('J1');

      const junctionsAfter = await adapter.getJunctions();
      const positionAfter = junctionsAfter.find(j => j.id === 'J1')?.position;

      expect(positionAfter).not.toBe(positionBefore);
    });

    it('should set junction position directly', async () => {
      await adapter.setJunctionPosition('J1', 'diverge');
      let junctions = await adapter.getJunctions();
      expect(junctions.find(j => j.id === 'J1')?.position).toBe('diverge');

      await adapter.setJunctionPosition('J1', 'straight');
      junctions = await adapter.getJunctions();
      expect(junctions.find(j => j.id === 'J1')?.position).toBe('straight');
    });
  });

  describe('Crossing Control', () => {
    it('should get all crossings', async () => {
      const crossings = await adapter.getCrossings();
      expect(crossings.length).toBeGreaterThan(0);
      crossings.forEach(crossing => {
        expect(crossing).toHaveProperty('id');
        expect(crossing).toHaveProperty('name');
        expect(crossing).toHaveProperty('isOpen');
        expect(crossing).toHaveProperty('gatePosition');
      });
    });

    it('should toggle crossing gate', async () => {
      const crossingsBefore = await adapter.getCrossings();
      const isOpenBefore = crossingsBefore.find(c => c.id === 'X1')?.isOpen;

      await adapter.toggleCrossing('X1');

      const crossingsAfter = await adapter.getCrossings();
      const isOpenAfter = crossingsAfter.find(c => c.id === 'X1')?.isOpen;

      expect(isOpenAfter).toBe(!isOpenBefore);
    });

    it('should set crossing gate position directly', async () => {
      await adapter.setCrossingGate('X1', 'down');
      let crossings = await adapter.getCrossings();
      expect(crossings.find(c => c.id === 'X1')?.gatePosition).toBe('down');
      expect(crossings.find(c => c.id === 'X1')?.isOpen).toBe(false);

      await adapter.setCrossingGate('X1', 'up');
      crossings = await adapter.getCrossings();
      expect(crossings.find(c => c.id === 'X1')?.gatePosition).toBe('up');
      expect(crossings.find(c => c.id === 'X1')?.isOpen).toBe(true);
    });
  });

  describe('Signal Control', () => {
    it('should get all signals', async () => {
      const signals = await adapter.getSignals();
      expect(signals.length).toBeGreaterThan(0);
      signals.forEach(signal => {
        expect(signal).toHaveProperty('id');
        expect(signal).toHaveProperty('color');
        expect(['red', 'yellow', 'green']).toContain(signal.color);
      });
    });
  });

  describe('Scenery Control', () => {
    it('should get scenery state', async () => {
      const scenery = await adapter.getScenery();
      expect(scenery).toHaveProperty('timeOfDay');
      expect(scenery).toHaveProperty('weather');
      expect(scenery).toHaveProperty('season');
      expect(scenery).toHaveProperty('lightsOn');
    });

    it('should set scenery state', async () => {
      await adapter.setScenery({ timeOfDay: 'night', lightsOn: true });
      const scenery = await adapter.getScenery();
      expect(scenery.timeOfDay).toBe('night');
      expect(scenery.lightsOn).toBe(true);
    });
  });

  describe('Subscription', () => {
    it('should subscribe to state changes', async () => {
      const callback = jest.fn();
      const unsubscribe = adapter.subscribe(callback);

      // Callback should be called immediately with current state
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        trains: expect.any(Array),
        junctions: expect.any(Array),
        crossings: expect.any(Array),
        signals: expect.any(Array),
        scenery: expect.any(Object),
        system: expect.any(Object),
      }));

      unsubscribe();
    });

    it('should notify subscribers on state change', async () => {
      const callback = jest.fn();
      adapter.subscribe(callback);

      callback.mockClear();
      await adapter.setTrainSpeed('1', 75);

      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', async () => {
      const callback = jest.fn();
      const unsubscribe = adapter.subscribe(callback);

      callback.mockClear();
      unsubscribe();
      await adapter.setTrainSpeed('1', 50);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Sound', () => {
    it('should play sound without error', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await expect(adapter.playSound('whistle')).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });
  });
});

describe('DemoAdapter Singleton', () => {
  afterEach(() => {
    resetDemoAdapter();
  });

  it('should return same instance', () => {
    const instance1 = getDemoAdapter();
    const instance2 = getDemoAdapter();
    expect(instance1).toBe(instance2);
  });

  it('should create new instance after reset', () => {
    const instance1 = getDemoAdapter();
    resetDemoAdapter();
    const instance2 = getDemoAdapter();
    expect(instance1).not.toBe(instance2);
  });
});

describe('HardwareAdapter Interface', () => {
  it('should ensure DemoAdapter implements HardwareAdapter', () => {
    const adapter: HardwareAdapter = getDemoAdapter();

    // System
    expect(adapter.getStatus).toBeDefined();
    expect(adapter.emergencyStop).toBeDefined();

    // Train Control
    expect(adapter.getTrains).toBeDefined();
    expect(adapter.setTrainSpeed).toBeDefined();
    expect(adapter.setTrainDirection).toBeDefined();
    expect(adapter.stopTrain).toBeDefined();
    expect(adapter.toggleHeadlights).toBeDefined();

    // Junction Control
    expect(adapter.getJunctions).toBeDefined();
    expect(adapter.toggleJunction).toBeDefined();
    expect(adapter.setJunctionPosition).toBeDefined();

    // Crossing Control
    expect(adapter.getCrossings).toBeDefined();
    expect(adapter.toggleCrossing).toBeDefined();
    expect(adapter.setCrossingGate).toBeDefined();

    // Signals
    expect(adapter.getSignals).toBeDefined();

    // Scenery
    expect(adapter.getScenery).toBeDefined();
    expect(adapter.setScenery).toBeDefined();

    // Sound
    expect(adapter.playSound).toBeDefined();

    resetDemoAdapter();
  });
});
