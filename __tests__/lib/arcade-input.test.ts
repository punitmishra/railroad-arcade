/**
 * Arcade Input Manager Unit Tests
 */

import {
  ArcadeInputManager,
  getArcadeInputManager,
  resetArcadeInputManager,
  InputEvent,
} from '@/lib/arcade-input';
import { DEFAULT_KEYBOARD_MAPPING } from '@/lib/kiosk-config';

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  return setTimeout(cb, 16) as unknown as number;
});
global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock navigator.getGamepads
const mockGetGamepads = jest.fn(() => [null, null, null, null]);
Object.defineProperty(global.navigator, 'getGamepads', {
  value: mockGetGamepads,
  writable: true,
});

describe('ArcadeInputManager', () => {
  let manager: ArcadeInputManager;

  beforeEach(() => {
    manager = new ArcadeInputManager();
  });

  afterEach(() => {
    manager.stop();
    jest.clearAllMocks();
  });

  describe('Lifecycle', () => {
    it('should start and stop without errors', () => {
      expect(() => manager.start()).not.toThrow();
      expect(() => manager.stop()).not.toThrow();
    });

    it('should not start twice', () => {
      manager.start();
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      manager.start(); // Second call should be ignored
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should add event listeners on start', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      manager.start();
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    it('should remove event listeners on stop', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      manager.start();
      manager.stop();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    });
  });

  describe('Keyboard Events', () => {
    let callback: jest.Mock;

    beforeEach(() => {
      callback = jest.fn();
      manager.subscribe(callback);
      manager.start();
    });

    it('should emit press event for mapped key', () => {
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EMERGENCY_STOP',
          type: 'press',
          value: 1,
          source: 'keyboard',
        })
      );
    });

    it('should emit release event for mapped key', () => {
      const pressEvent = new KeyboardEvent('keydown', { code: 'Space' });
      const releaseEvent = new KeyboardEvent('keyup', { code: 'Space' });

      window.dispatchEvent(pressEvent);
      window.dispatchEvent(releaseEvent);

      expect(callback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: 'EMERGENCY_STOP',
          type: 'release',
          value: 0,
          source: 'keyboard',
        })
      );
    });

    it('should emit repeat event for held key', () => {
      const event1 = new KeyboardEvent('keydown', { code: 'Space' });
      const event2 = new KeyboardEvent('keydown', { code: 'Space' });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(callback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: 'repeat',
        })
      );
    });

    it('should not emit for unmapped keys', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyZ' });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should prevent default for mapped keys', () => {
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Subscription', () => {
    it('should add and remove subscribers', () => {
      const callback = jest.fn();
      const unsubscribe = manager.subscribe(callback);

      manager.start();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      unsubscribe();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      expect(callback).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      manager.subscribe(callback1);
      manager.subscribe(callback2);
      manager.start();

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('State Queries', () => {
    beforeEach(() => {
      manager.start();
    });

    it('should track pressed keys', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(manager.isKeyPressed('Space')).toBe(true);

      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
      expect(manager.isKeyPressed('Space')).toBe(false);
    });

    it('should check if action is pressed', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(manager.isActionPressed('EMERGENCY_STOP')).toBe(true);

      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
      expect(manager.isActionPressed('EMERGENCY_STOP')).toBe(false);
    });
  });

  describe('Mapping Updates', () => {
    it('should update keyboard mapping', () => {
      const callback = jest.fn();
      manager.subscribe(callback);
      manager.start();

      // Update mapping to use a different key
      manager.updateKeyboardMapping({ KeyZ: 'EMERGENCY_STOP' });

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EMERGENCY_STOP',
        })
      );
    });
  });
});

describe('Singleton Pattern', () => {
  afterEach(() => {
    resetArcadeInputManager();
  });

  it('should return same instance', () => {
    const instance1 = getArcadeInputManager();
    const instance2 = getArcadeInputManager();
    expect(instance1).toBe(instance2);
  });

  it('should create new instance after reset', () => {
    const instance1 = getArcadeInputManager();
    resetArcadeInputManager();
    const instance2 = getArcadeInputManager();
    expect(instance1).not.toBe(instance2);
  });
});
