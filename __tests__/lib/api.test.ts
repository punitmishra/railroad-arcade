/**
 * API Client Unit Tests
 * Tests the API client that connects to the Raspberry Pi Rust backend
 */

import {
  ApiError,
  TrackStatus,
  SystemStatus,
  CpxStatus,
  CameraStatus,
  DistanceReading,
  SceneryState,
  Schedule,
  AutomationSequence,
  getApiBase,
  isConnected,
} from '@/lib/api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create mock response
function mockResponse<T>(data: T, success = true): Response {
  return {
    ok: true,
    json: async () => ({ success, data, error: success ? undefined : 'Error' }),
  } as Response;
}

function mockErrorResponse(status: number, error?: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({ success: false, error }),
  } as Response;
}

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('ApiError', () => {
    it('should create error with status and message', () => {
      const error = new ApiError('Test error', 404, 'Not found');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.apiError).toBe('Not found');
      expect(error.name).toBe('ApiError');
    });
  });

  describe('Type Definitions', () => {
    it('should have correct TrackStatus type', () => {
      const track: TrackStatus = {
        id: '1',
        name: 'Test Track',
        speed: 50,
        direction: 'forward',
        running: true,
      };
      expect(track.id).toBe('1');
      expect(typeof track.id).toBe('string');
    });

    it('should have correct SystemStatus type', () => {
      const status: SystemStatus = {
        controller: true,
        cpx: true,
        camera: true,
        tracks: [],
        distances: [],
        camera_url: 'http://localhost:8080',
      };
      expect(status.controller).toBe(true);
    });

    it('should have correct CpxStatus type', () => {
      const cpx: CpxStatus = {
        connected: true,
        servos: [0, 45, 0, 90],
        ldr_raw: [500, 600, 700],
        ldr_blocked: [false, true, false],
        gate: 'up',
        auto_gate: false,
      };
      expect(cpx.servos.length).toBe(4);
      expect(cpx.ldr_raw.length).toBe(3);
    });

    it('should have correct CameraStatus type', () => {
      const camera: CameraStatus = {
        running: true,
        stream_url: 'http://localhost:8080/stream.mjpg',
      };
      expect(camera.running).toBe(true);
    });

    it('should have correct DistanceReading type', () => {
      const reading: DistanceReading = {
        name: 'station1',
        distance_cm: 45.5,
        blocked: false,
      };
      expect(reading.blocked).toBe(false);
    });

    it('should have correct SceneryState type', () => {
      const scenery: SceneryState = {
        time_of_day: 'night',
        lighting: {
          residential: true,
          entertainment: true,
          station1: true,
          station2: true,
          parking: false,
          tunnels: true,
          streets: true,
        },
        water_features: {
          waterfall1: true,
          waterfall2: false,
          harbor: true,
          boats: true,
        },
      };
      expect(scenery.time_of_day).toBe('night');
    });

    it('should have correct Schedule type', () => {
      const schedule: Schedule = {
        id: 1,
        name: 'Morning Run',
        track_id: '1',
        action: 'forward',
        speed: 50,
        time: '08:00',
        duration: 3600,
        enabled: true,
      };
      expect(schedule.track_id).toBe('1');
    });

    it('should have correct AutomationSequence type', () => {
      const sequence: AutomationSequence = {
        id: 'demo',
        name: 'Demo Sequence',
        description: 'A demo automation sequence',
        steps: [
          { action: 'start_train', target: '1', value: 50, delay_ms: 0 },
          { action: 'set_gate', target: 'down', delay_ms: 5000 },
        ],
      };
      expect(sequence.steps.length).toBe(2);
    });
  });

  describe('Utility Functions', () => {
    it('should return API base URL', () => {
      const base = getApiBase();
      expect(typeof base).toBe('string');
      expect(base).toContain('http');
    });

    it('should check connection status', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse<SystemStatus>({
        controller: true,
        cpx: true,
        camera: false,
        tracks: [],
        distances: [],
      }));

      const connected = await isConnected();
      expect(connected).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const connected = await isConnected();
      expect(connected).toBe(false);
    });
  });

  describe('DEFAULT_* Constants', () => {
    it('should have correct DEFAULT_LOCOMOTIVES', async () => {
      const { DEFAULT_LOCOMOTIVES } = await import('@/lib/api');
      expect(DEFAULT_LOCOMOTIVES.length).toBe(3);
      DEFAULT_LOCOMOTIVES.forEach(loco => {
        expect(typeof loco.trackId).toBe('string');
        expect(loco).toHaveProperty('name');
        expect(loco).toHaveProperty('color');
        expect(loco).toHaveProperty('level');
      });
    });

    it('should have correct DEFAULT_JUNCTIONS', async () => {
      const { DEFAULT_JUNCTIONS } = await import('@/lib/api');
      expect(DEFAULT_JUNCTIONS.length).toBeGreaterThan(0);
      DEFAULT_JUNCTIONS.forEach(junction => {
        expect(junction).toHaveProperty('id');
        expect(junction).toHaveProperty('name');
        expect(junction).toHaveProperty('level');
        expect(junction).toHaveProperty('servoNum');
      });
    });

    it('should have correct DEFAULT_CROSSINGS', async () => {
      const { DEFAULT_CROSSINGS } = await import('@/lib/api');
      expect(DEFAULT_CROSSINGS.length).toBeGreaterThan(0);
    });

    it('should have correct DEFAULT_STATIONS', async () => {
      const { DEFAULT_STATIONS } = await import('@/lib/api');
      expect(DEFAULT_STATIONS.length).toBe(2);
    });

    it('should have correct DEFAULT_DISTANCE_SENSORS', async () => {
      const { DEFAULT_DISTANCE_SENSORS } = await import('@/lib/api');
      expect(DEFAULT_DISTANCE_SENSORS.length).toBeGreaterThan(0);
      DEFAULT_DISTANCE_SENSORS.forEach(sensor => {
        expect(sensor).toHaveProperty('name');
        expect(sensor).toHaveProperty('label');
        expect(sensor).toHaveProperty('trigPin');
        expect(sensor).toHaveProperty('echoPin');
      });
    });
  });
});

describe('API Response Handling', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should handle successful API responses', async () => {
    const { getStatus } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse<SystemStatus>({
      controller: true,
      cpx: true,
      camera: false,
      tracks: [
        { id: '1', name: 'Track 1', speed: 50, direction: 'forward', running: true },
      ],
      distances: [],
    }));

    const status = await getStatus();
    expect(status.controller).toBe(true);
    expect(status.tracks.length).toBe(1);
  });

  it('should handle API errors', async () => {
    const { getStatus } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockErrorResponse(500, 'Internal Server Error'));

    await expect(getStatus()).rejects.toThrow(ApiError);
  });

  it('should handle network errors', async () => {
    const { getStatus } = await import('@/lib/api');

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(getStatus()).rejects.toThrow(ApiError);
  });

  it('should handle unsuccessful API responses', async () => {
    const { getStatus } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Something went wrong' }),
    } as Response);

    await expect(getStatus()).rejects.toThrow(ApiError);
  });
});

describe('Track API Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should get all tracks', async () => {
    const { getTracks } = await import('@/lib/api');

    const tracks: TrackStatus[] = [
      { id: '1', name: 'Track 1', speed: 50, direction: 'forward', running: true },
      { id: '2', name: 'Track 2', speed: 0, direction: 'stop', running: false },
    ];

    mockFetch.mockResolvedValueOnce(mockResponse(tracks));

    const result = await getTracks();
    expect(result).toEqual(tracks);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tracks'),
      expect.any(Object)
    );
  });

  it('should get single track', async () => {
    const { getTrack } = await import('@/lib/api');

    const track: TrackStatus = { id: '1', name: 'Track 1', speed: 50, direction: 'forward', running: true };

    mockFetch.mockResolvedValueOnce(mockResponse(track));

    const result = await getTrack('1');
    expect(result).toEqual(track);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tracks/1'),
      expect.any(Object)
    );
  });

  it('should set track speed', async () => {
    const { setTrackSpeed } = await import('@/lib/api');

    const track: TrackStatus = { id: '1', name: 'Track 1', speed: 75, direction: 'forward', running: true };

    mockFetch.mockResolvedValueOnce(mockResponse(track));

    const result = await setTrackSpeed('1', 75);
    expect(result.speed).toBe(75);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tracks/1/speed'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('75'),
      })
    );
  });

  it('should set track forward', async () => {
    const { setTrackForward } = await import('@/lib/api');

    const track: TrackStatus = { id: '1', name: 'Track 1', speed: 50, direction: 'forward', running: true };

    mockFetch.mockResolvedValueOnce(mockResponse(track));

    await setTrackForward('1', 50);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tracks/1/forward'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should set track reverse', async () => {
    const { setTrackReverse } = await import('@/lib/api');

    const track: TrackStatus = { id: '1', name: 'Track 1', speed: 50, direction: 'reverse', running: true };

    mockFetch.mockResolvedValueOnce(mockResponse(track));

    await setTrackReverse('1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tracks/1/reverse'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should stop track', async () => {
    const { stopTrack } = await import('@/lib/api');

    const track: TrackStatus = { id: '1', name: 'Track 1', speed: 0, direction: 'stop', running: false };

    mockFetch.mockResolvedValueOnce(mockResponse(track));

    await stopTrack('1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tracks/1/stop'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('CPX API Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should get CPX status', async () => {
    const { getCpxStatus } = await import('@/lib/api');

    const status: CpxStatus = {
      connected: true,
      servos: [0, 0, 0, 0],
      ldr_raw: [500, 500, 500],
      ldr_blocked: [false, false, false],
      gate: 'up',
      auto_gate: false,
    };

    mockFetch.mockResolvedValueOnce(mockResponse(status));

    const result = await getCpxStatus();
    expect(result.connected).toBe(true);
  });

  it('should set gate position', async () => {
    const { setGate } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse({
      connected: true,
      servos: [0, 0, 0, 0],
      ldr_raw: [500, 500, 500],
      ldr_blocked: [false, false, false],
      gate: 'down',
      auto_gate: false,
    }));

    await setGate('down');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cpx/gate/down'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should set servo angle', async () => {
    const { setServo } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse(undefined));

    await setServo(1, 45);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cpx/servo/1'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('45'),
      })
    );
  });

  it('should calibrate servos', async () => {
    const { calibrateServos } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse(undefined));

    await calibrateServos();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cpx/calibrate'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should play sound', async () => {
    const { playSound } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse(undefined));

    await playSound('whistle');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cpx/sound/whistle'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should set LED color', async () => {
    const { setLed } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse(undefined));

    await setLed('red');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cpx/led/red'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should get temperature', async () => {
    const { getCpxTemperature } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse(25.5));

    const temp = await getCpxTemperature();
    expect(temp).toBe(25.5);
  });
});

describe('Camera API Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should get camera status', async () => {
    const { getCameraStatus } = await import('@/lib/api');

    const status: CameraStatus = {
      running: true,
      stream_url: 'http://localhost:8080/stream.mjpg',
    };

    mockFetch.mockResolvedValueOnce(mockResponse(status));

    const result = await getCameraStatus();
    expect(result.running).toBe(true);
    expect(result.stream_url).toContain('stream.mjpg');
  });

  it('should start camera', async () => {
    const { startCamera } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse({
      running: true,
      stream_url: 'http://localhost:8080/stream.mjpg',
    }));

    const result = await startCamera();
    expect(result.running).toBe(true);
  });

  it('should stop camera', async () => {
    const { stopCamera } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse({
      running: false,
      stream_url: undefined,
    }));

    const result = await stopCamera();
    expect(result.running).toBe(false);
  });
});

describe('Distance Sensor API Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should get all distance readings', async () => {
    const { getDistances } = await import('@/lib/api');

    const readings: DistanceReading[] = [
      { name: 'station1', distance_cm: 45.5, blocked: false },
      { name: 'crossing1', distance_cm: 5.2, blocked: true },
    ];

    mockFetch.mockResolvedValueOnce(mockResponse(readings));

    const result = await getDistances();
    expect(result.length).toBe(2);
    expect(result[1].blocked).toBe(true);
  });

  it('should get single distance reading', async () => {
    const { getDistance } = await import('@/lib/api');

    const reading: DistanceReading = { name: 'station1', distance_cm: 45.5, blocked: false };

    mockFetch.mockResolvedValueOnce(mockResponse(reading));

    const result = await getDistance('station1');
    expect(result.name).toBe('station1');
  });
});

describe('Scenery API Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should get scenery state', async () => {
    const { getScenery } = await import('@/lib/api');

    const scenery: SceneryState = {
      time_of_day: 'day',
      lighting: {
        residential: false,
        entertainment: false,
        station1: false,
        station2: false,
        parking: false,
        tunnels: false,
        streets: false,
      },
      water_features: {
        waterfall1: true,
        waterfall2: true,
        harbor: true,
        boats: true,
      },
    };

    mockFetch.mockResolvedValueOnce(mockResponse(scenery));

    const result = await getScenery();
    expect(result.time_of_day).toBe('day');
  });

  it('should set scenery state', async () => {
    const { setScenery } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse({
      time_of_day: 'night',
      lighting: {
        residential: true,
        entertainment: true,
        station1: true,
        station2: true,
        parking: true,
        tunnels: true,
        streets: true,
      },
      water_features: {
        waterfall1: true,
        waterfall2: true,
        harbor: true,
        boats: true,
      },
    }));

    const result = await setScenery({ time_of_day: 'night' });
    expect(result.time_of_day).toBe('night');
  });
});

describe('Schedule API Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should get schedules', async () => {
    const { getSchedules } = await import('@/lib/api');

    const schedules: Schedule[] = [
      { id: 1, name: 'Morning', track_id: '1', action: 'forward', speed: 50, duration: 3600, enabled: true },
    ];

    mockFetch.mockResolvedValueOnce(mockResponse(schedules));

    const result = await getSchedules();
    expect(result.length).toBe(1);
  });

  it('should create schedule', async () => {
    const { createSchedule } = await import('@/lib/api');

    const schedule: Schedule = { id: 1, name: 'Test', track_id: '1', action: 'forward', speed: 50, duration: 3600, enabled: true };

    mockFetch.mockResolvedValueOnce(mockResponse(schedule));

    const result = await createSchedule({
      name: 'Test',
      track_id: '1',
      action: 'forward',
      speed: 50,
      duration: 3600,
      enabled: true,
    });
    expect(result.id).toBe(1);
  });

  it('should delete schedule', async () => {
    const { deleteSchedule } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse(undefined));

    await deleteSchedule(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/schedules/1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

describe('Automation API Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should get sequences', async () => {
    const { getSequences } = await import('@/lib/api');

    const sequences: AutomationSequence[] = [
      { id: 'demo', name: 'Demo', description: 'Demo sequence', steps: [] },
    ];

    mockFetch.mockResolvedValueOnce(mockResponse(sequences));

    const result = await getSequences();
    expect(result.length).toBe(1);
  });

  it('should run sequence', async () => {
    const { runSequence } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce(mockResponse('Running sequence: demo'));

    await runSequence('demo');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/automation/run/demo'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
