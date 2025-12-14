/**
 * Kiosk Configuration Unit Tests
 */

import {
  DEFAULT_DISPLAY_CONFIG,
  DEFAULT_KEYBOARD_MAPPING,
  DEFAULT_GAMEPAD_MAPPING,
  DEFAULT_COIN_CONFIG,
  DEFAULT_SESSION_CONFIG,
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_KIOSK_CONFIG,
  getActionForKey,
  getActionForButton,
  loadKioskConfig,
  saveKioskConfig,
  InputAction,
} from '@/lib/kiosk-config';

describe('Kiosk Configuration', () => {
  describe('DEFAULT_DISPLAY_CONFIG', () => {
    it('should have fullscreen enabled by default', () => {
      expect(DEFAULT_DISPLAY_CONFIG.fullscreen).toBe(true);
    });

    it('should be landscape orientation', () => {
      expect(DEFAULT_DISPLAY_CONFIG.orientation).toBe('landscape');
    });

    it('should have cursor hidden', () => {
      expect(DEFAULT_DISPLAY_CONFIG.cursorHidden).toBe(true);
    });

    it('should have valid resolution', () => {
      expect(DEFAULT_DISPLAY_CONFIG.resolution.width).toBeGreaterThan(0);
      expect(DEFAULT_DISPLAY_CONFIG.resolution.height).toBeGreaterThan(0);
    });

    it('should have screensaver timeout', () => {
      expect(DEFAULT_DISPLAY_CONFIG.screensaverTimeout).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_KEYBOARD_MAPPING', () => {
    it('should have WASD mapped for train 1', () => {
      expect(DEFAULT_KEYBOARD_MAPPING['KeyW']).toBe('TRAIN_1_THROTTLE_UP');
      expect(DEFAULT_KEYBOARD_MAPPING['KeyS']).toBe('TRAIN_1_THROTTLE_DOWN');
      expect(DEFAULT_KEYBOARD_MAPPING['KeyA']).toBe('TRAIN_1_REVERSE');
      expect(DEFAULT_KEYBOARD_MAPPING['KeyD']).toBe('TRAIN_1_STOP');
    });

    it('should have arrow keys mapped for train 2', () => {
      expect(DEFAULT_KEYBOARD_MAPPING['ArrowUp']).toBe('TRAIN_2_THROTTLE_UP');
      expect(DEFAULT_KEYBOARD_MAPPING['ArrowDown']).toBe('TRAIN_2_THROTTLE_DOWN');
      expect(DEFAULT_KEYBOARD_MAPPING['ArrowLeft']).toBe('TRAIN_2_REVERSE');
      expect(DEFAULT_KEYBOARD_MAPPING['ArrowRight']).toBe('TRAIN_2_STOP');
    });

    it('should have emergency stop on spacebar', () => {
      expect(DEFAULT_KEYBOARD_MAPPING['Space']).toBe('EMERGENCY_STOP');
    });

    it('should have junction controls on number keys', () => {
      expect(DEFAULT_KEYBOARD_MAPPING['Digit1']).toBe('JUNCTION_1_TOGGLE');
      expect(DEFAULT_KEYBOARD_MAPPING['Digit2']).toBe('JUNCTION_2_TOGGLE');
      expect(DEFAULT_KEYBOARD_MAPPING['Digit3']).toBe('JUNCTION_3_TOGGLE');
    });

    it('should have game controls', () => {
      expect(DEFAULT_KEYBOARD_MAPPING['Enter']).toBe('START_GAME');
      expect(DEFAULT_KEYBOARD_MAPPING['KeyP']).toBe('PAUSE_GAME');
    });

    it('should have camera controls', () => {
      expect(DEFAULT_KEYBOARD_MAPPING['BracketRight']).toBe('CAMERA_NEXT');
      expect(DEFAULT_KEYBOARD_MAPPING['BracketLeft']).toBe('CAMERA_PREV');
    });
  });

  describe('DEFAULT_GAMEPAD_MAPPING', () => {
    it('should have button mappings', () => {
      expect(DEFAULT_GAMEPAD_MAPPING.buttons).toBeDefined();
      expect(Object.keys(DEFAULT_GAMEPAD_MAPPING.buttons).length).toBeGreaterThan(0);
    });

    it('should have A/B buttons for confirm/cancel', () => {
      expect(DEFAULT_GAMEPAD_MAPPING.buttons[0]).toBe('CONFIRM');
      expect(DEFAULT_GAMEPAD_MAPPING.buttons[1]).toBe('CANCEL');
    });

    it('should have axes configuration', () => {
      expect(DEFAULT_GAMEPAD_MAPPING.axes).toBeDefined();
      expect(Array.isArray(DEFAULT_GAMEPAD_MAPPING.axes)).toBe(true);
    });

    it('should have valid axis thresholds', () => {
      DEFAULT_GAMEPAD_MAPPING.axes.forEach(axis => {
        expect(axis.threshold).toBeGreaterThan(0);
        expect(axis.threshold).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('DEFAULT_COIN_CONFIG', () => {
    it('should have coin acceptor disabled by default', () => {
      expect(DEFAULT_COIN_CONFIG.enabled).toBe(false);
    });

    it('should have endpoint defined', () => {
      expect(DEFAULT_COIN_CONFIG.endpoint).toBe('/api/kiosk/coin');
    });

    it('should have token values for coin types', () => {
      expect(DEFAULT_COIN_CONFIG.tokensPer.quarter).toBe(1);
      expect(DEFAULT_COIN_CONFIG.tokensPer.dollar).toBe(5);
      expect(DEFAULT_COIN_CONFIG.tokensPer.token).toBe(1);
    });
  });

  describe('DEFAULT_SESSION_CONFIG', () => {
    it('should have idle timeout', () => {
      expect(DEFAULT_SESSION_CONFIG.idleTimeout).toBeGreaterThan(0);
    });

    it('should have attract mode enabled', () => {
      expect(DEFAULT_SESSION_CONFIG.attractMode).toBe(true);
    });

    it('should have free play mode enabled', () => {
      expect(DEFAULT_SESSION_CONFIG.freePlayMode).toBe(true);
    });

    it('should show leaderboard', () => {
      expect(DEFAULT_SESSION_CONFIG.showLeaderboard).toBe(true);
    });
  });

  describe('DEFAULT_AUDIO_CONFIG', () => {
    it('should have audio enabled', () => {
      expect(DEFAULT_AUDIO_CONFIG.enabled).toBe(true);
    });

    it('should have valid volume levels', () => {
      expect(DEFAULT_AUDIO_CONFIG.masterVolume).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_AUDIO_CONFIG.masterVolume).toBeLessThanOrEqual(1);
      expect(DEFAULT_AUDIO_CONFIG.sfxVolume).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_AUDIO_CONFIG.sfxVolume).toBeLessThanOrEqual(1);
      expect(DEFAULT_AUDIO_CONFIG.musicVolume).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_AUDIO_CONFIG.musicVolume).toBeLessThanOrEqual(1);
    });

    it('should have sound file paths', () => {
      expect(DEFAULT_AUDIO_CONFIG.coinSound).toBeTruthy();
      expect(DEFAULT_AUDIO_CONFIG.startSound).toBeTruthy();
      expect(DEFAULT_AUDIO_CONFIG.gameOverSound).toBeTruthy();
    });
  });

  describe('DEFAULT_KIOSK_CONFIG', () => {
    it('should contain all config sections', () => {
      expect(DEFAULT_KIOSK_CONFIG.display).toBeDefined();
      expect(DEFAULT_KIOSK_CONFIG.input).toBeDefined();
      expect(DEFAULT_KIOSK_CONFIG.coin).toBeDefined();
      expect(DEFAULT_KIOSK_CONFIG.session).toBeDefined();
      expect(DEFAULT_KIOSK_CONFIG.audio).toBeDefined();
    });
  });

  describe('getActionForKey', () => {
    it('should return action for valid key', () => {
      const action = getActionForKey('Space', DEFAULT_KEYBOARD_MAPPING);
      expect(action).toBe('EMERGENCY_STOP');
    });

    it('should return null for unmapped key', () => {
      const action = getActionForKey('KeyZ', DEFAULT_KEYBOARD_MAPPING);
      expect(action).toBeNull();
    });
  });

  describe('getActionForButton', () => {
    it('should return action for valid button', () => {
      const action = getActionForButton(0, DEFAULT_GAMEPAD_MAPPING);
      expect(action).toBe('CONFIRM');
    });

    it('should return null for unmapped button', () => {
      const action = getActionForButton(99, DEFAULT_GAMEPAD_MAPPING);
      expect(action).toBeNull();
    });
  });

  describe('loadKioskConfig and saveKioskConfig', () => {
    const mockStorage: Record<string, string> = {};

    beforeEach(() => {
      // Mock localStorage
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn((key: string) => mockStorage[key] || null),
          setItem: jest.fn((key: string, value: string) => {
            mockStorage[key] = value;
          }),
          removeItem: jest.fn((key: string) => {
            delete mockStorage[key];
          }),
          clear: jest.fn(() => {
            Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
          }),
        },
        writable: true,
      });
    });

    afterEach(() => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    });

    it('should return default config when no stored config', () => {
      const config = loadKioskConfig();
      expect(config).toEqual(DEFAULT_KIOSK_CONFIG);
    });

    it('should save and load custom config', () => {
      const customConfig = { cabinetId: 'cabinet-123' };
      saveKioskConfig(customConfig);

      const loaded = loadKioskConfig();
      expect(loaded.cabinetId).toBe('cabinet-123');
    });
  });
});
