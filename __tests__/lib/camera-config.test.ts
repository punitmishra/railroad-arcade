/**
 * Camera Configuration Unit Tests
 */

import {
  CAMERAS,
  CAMERA_LAYOUTS,
  getCameraById,
  getCamerasByLevel,
  getPrimaryCamera,
  getLayoutById,
  buildStreamUrl,
  DEFAULT_VIEW_CONFIG,
  PRESET_VIEWS,
  CameraConfig,
  LayoutId,
} from '@/lib/camera-config';

describe('Camera Configuration', () => {
  describe('CAMERAS', () => {
    it('should have at least 6 cameras defined', () => {
      expect(CAMERAS.length).toBeGreaterThanOrEqual(6);
    });

    it('should have unique camera IDs', () => {
      const ids = CAMERAS.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required properties', () => {
      CAMERAS.forEach(camera => {
        expect(camera).toHaveProperty('id');
        expect(camera).toHaveProperty('name');
        expect(camera).toHaveProperty('description');
        expect(camera).toHaveProperty('streamUrl');
        expect(camera).toHaveProperty('position');
        expect(camera).toHaveProperty('level');
      });
    });

    it('should have exactly one primary camera', () => {
      const primaryCameras = CAMERAS.filter(c => c.isPrimary);
      expect(primaryCameras.length).toBe(1);
    });

    it('should have valid positions', () => {
      const validPositions = ['overhead', 'station', 'tunnel', 'junction', 'scenic'];
      CAMERAS.forEach(camera => {
        expect(validPositions).toContain(camera.position);
      });
    });
  });

  describe('CAMERA_LAYOUTS', () => {
    it('should have 5 layouts defined', () => {
      expect(CAMERA_LAYOUTS.length).toBe(5);
    });

    it('should have unique layout IDs', () => {
      const ids = CAMERA_LAYOUTS.map(l => l.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid slot counts', () => {
      CAMERA_LAYOUTS.forEach(layout => {
        expect(layout.slots).toBeGreaterThanOrEqual(1);
        expect(layout.slots).toBeLessThanOrEqual(4);
      });
    });

    it('should have grid classes defined', () => {
      CAMERA_LAYOUTS.forEach(layout => {
        expect(layout.gridClass).toBeTruthy();
      });
    });
  });

  describe('getCameraById', () => {
    it('should return camera for valid ID', () => {
      const camera = getCameraById('overhead');
      expect(camera).toBeDefined();
      expect(camera?.id).toBe('overhead');
    });

    it('should return undefined for invalid ID', () => {
      const camera = getCameraById('nonexistent');
      expect(camera).toBeUndefined();
    });
  });

  describe('getCamerasByLevel', () => {
    it('should return cameras for level 0 (includes overhead)', () => {
      const cameras = getCamerasByLevel(0);
      expect(cameras.length).toBeGreaterThan(0);
    });

    it('should return level 0 cameras plus specific level cameras', () => {
      const level1Cameras = getCamerasByLevel(1);
      const hasLevel0 = level1Cameras.some(c => c.level === 0);
      const hasLevel1 = level1Cameras.some(c => c.level === 1);
      expect(hasLevel0 || hasLevel1).toBe(true);
    });
  });

  describe('getPrimaryCamera', () => {
    it('should return the primary camera', () => {
      const primary = getPrimaryCamera();
      expect(primary).toBeDefined();
      expect(primary.isPrimary).toBe(true);
    });

    it('should return overhead as primary', () => {
      const primary = getPrimaryCamera();
      expect(primary.id).toBe('overhead');
    });
  });

  describe('getLayoutById', () => {
    it('should return layout for valid ID', () => {
      const layout = getLayoutById('single');
      expect(layout).toBeDefined();
      expect(layout?.id).toBe('single');
    });

    it('should return undefined for invalid ID', () => {
      const layout = getLayoutById('invalid' as LayoutId);
      expect(layout).toBeUndefined();
    });

    it('should return correct slot count for each layout', () => {
      expect(getLayoutById('single')?.slots).toBe(1);
      expect(getLayoutById('dual-h')?.slots).toBe(2);
      expect(getLayoutById('dual-v')?.slots).toBe(2);
      expect(getLayoutById('quad')?.slots).toBe(4);
      expect(getLayoutById('pip')?.slots).toBe(2);
    });
  });

  describe('buildStreamUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return empty string for invalid camera', () => {
      const url = buildStreamUrl('nonexistent');
      expect(url).toBe('');
    });

    it('should return placeholder URL in development', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      const url = buildStreamUrl('overhead');
      expect(url).toContain('/api/camera/placeholder');
      expect(url).toContain('id=overhead');
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
    });
  });

  describe('DEFAULT_VIEW_CONFIG', () => {
    it('should have valid default layout', () => {
      expect(DEFAULT_VIEW_CONFIG.layout).toBe('single');
    });

    it('should have valid default cameras', () => {
      expect(DEFAULT_VIEW_CONFIG.cameras).toContain('overhead');
    });
  });

  describe('PRESET_VIEWS', () => {
    it('should have overview preset', () => {
      expect(PRESET_VIEWS.overview).toBeDefined();
      expect(PRESET_VIEWS.overview.layout).toBe('single');
    });

    it('should have stations preset with dual layout', () => {
      expect(PRESET_VIEWS.stations).toBeDefined();
      expect(PRESET_VIEWS.stations.layout).toBe('dual-h');
      expect(PRESET_VIEWS.stations.cameras.length).toBe(2);
    });

    it('should have action preset with PiP layout', () => {
      expect(PRESET_VIEWS.action).toBeDefined();
      expect(PRESET_VIEWS.action.layout).toBe('pip');
    });

    it('should have all preset with quad layout', () => {
      expect(PRESET_VIEWS.all).toBeDefined();
      expect(PRESET_VIEWS.all.layout).toBe('quad');
      expect(PRESET_VIEWS.all.cameras.length).toBe(4);
    });

    it('should only reference valid camera IDs', () => {
      const validIds = CAMERAS.map(c => c.id);
      Object.values(PRESET_VIEWS).forEach(preset => {
        preset.cameras.forEach(cameraId => {
          expect(validIds).toContain(cameraId);
        });
      });
    });
  });
});
