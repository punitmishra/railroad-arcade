// ============================================
// Arcade Input Handler
// ============================================
// Manages keyboard and gamepad inputs for
// arcade cabinet and desktop gameplay.

import {
  InputAction,
  InputMapping,
  DEFAULT_KEYBOARD_MAPPING,
  DEFAULT_GAMEPAD_MAPPING,
  getActionForKey,
  getActionForButton,
} from './kiosk-config';

// ============================================
// Types
// ============================================

export type InputEventType = 'press' | 'release' | 'repeat' | 'axis';

export interface InputEvent {
  action: InputAction;
  type: InputEventType;
  value: number; // 0-1 for press/release, -1 to 1 for axis
  source: 'keyboard' | 'gamepad';
  timestamp: number;
}

export type InputCallback = (event: InputEvent) => void;

// ============================================
// Arcade Input Manager Class
// ============================================

export class ArcadeInputManager {
  private keyboardMapping: Record<string, InputAction>;
  private gamepadMapping: InputMapping['gamepad'];
  private callbacks: Set<InputCallback>;
  private pressedKeys: Set<string>;
  private pressedButtons: Set<number>;
  private axisValues: Map<number, number>;
  private gamepadIndex: number | null;
  private rafId: number | null;
  private isActive: boolean;

  constructor(mapping?: InputMapping) {
    this.keyboardMapping = mapping?.keyboard ?? DEFAULT_KEYBOARD_MAPPING;
    this.gamepadMapping = mapping?.gamepad ?? DEFAULT_GAMEPAD_MAPPING;
    this.callbacks = new Set();
    this.pressedKeys = new Set();
    this.pressedButtons = new Set();
    this.axisValues = new Map();
    this.gamepadIndex = null;
    this.rafId = null;
    this.isActive = false;
  }

  // ============================================
  // Lifecycle
  // ============================================

  start(): void {
    if (this.isActive || typeof window === 'undefined') return;

    this.isActive = true;

    // Keyboard listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Gamepad listeners
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);

    // Start gamepad polling
    this.startGamepadPolling();
  }

  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.pressedKeys.clear();
    this.pressedButtons.clear();
    this.axisValues.clear();
  }

  // ============================================
  // Event Subscription
  // ============================================

  subscribe(callback: InputCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private emit(event: InputEvent): void {
    this.callbacks.forEach((cb) => cb(event));
  }

  // ============================================
  // Keyboard Handling
  // ============================================

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Prevent default for mapped keys
    const action = getActionForKey(e.code, this.keyboardMapping);
    if (!action) return;

    e.preventDefault();

    const isRepeat = this.pressedKeys.has(e.code);
    this.pressedKeys.add(e.code);

    this.emit({
      action,
      type: isRepeat ? 'repeat' : 'press',
      value: 1,
      source: 'keyboard',
      timestamp: Date.now(),
    });
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const action = getActionForKey(e.code, this.keyboardMapping);
    if (!action) return;

    e.preventDefault();

    this.pressedKeys.delete(e.code);

    this.emit({
      action,
      type: 'release',
      value: 0,
      source: 'keyboard',
      timestamp: Date.now(),
    });
  };

  // ============================================
  // Gamepad Handling
  // ============================================

  private handleGamepadConnected = (e: GamepadEvent): void => {
    console.log('Gamepad connected:', e.gamepad.id);
    this.gamepadIndex = e.gamepad.index;
  };

  private handleGamepadDisconnected = (e: GamepadEvent): void => {
    console.log('Gamepad disconnected:', e.gamepad.id);
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepadIndex = null;
    }
  };

  private startGamepadPolling(): void {
    const poll = (): void => {
      if (!this.isActive) return;

      this.pollGamepad();
      this.rafId = requestAnimationFrame(poll);
    };

    this.rafId = requestAnimationFrame(poll);
  }

  private pollGamepad(): void {
    if (this.gamepadIndex === null) {
      // Try to find a connected gamepad
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          this.gamepadIndex = i;
          break;
        }
      }
      if (this.gamepadIndex === null) return;
    }

    const gamepad = navigator.getGamepads()[this.gamepadIndex];
    if (!gamepad) {
      this.gamepadIndex = null;
      return;
    }

    // Poll buttons
    gamepad.buttons.forEach((button, index) => {
      const action = getActionForButton(index, this.gamepadMapping);
      if (!action) return;

      const wasPressed = this.pressedButtons.has(index);
      const isPressed = button.pressed;

      if (isPressed && !wasPressed) {
        this.pressedButtons.add(index);
        this.emit({
          action,
          type: 'press',
          value: button.value,
          source: 'gamepad',
          timestamp: Date.now(),
        });
      } else if (!isPressed && wasPressed) {
        this.pressedButtons.delete(index);
        this.emit({
          action,
          type: 'release',
          value: 0,
          source: 'gamepad',
          timestamp: Date.now(),
        });
      }
    });

    // Poll axes
    this.gamepadMapping.axes.forEach((axisConfig, index) => {
      if (index >= gamepad.axes.length) return;

      const value = gamepad.axes[index];
      const prevValue = this.axisValues.get(index) ?? 0;
      const threshold = axisConfig.threshold;

      // Check if axis crossed threshold
      const isActive =
        axisConfig.direction === 'positive'
          ? value > threshold
          : value < -threshold;

      const wasActive =
        axisConfig.direction === 'positive'
          ? prevValue > threshold
          : prevValue < -threshold;

      if (isActive !== wasActive) {
        this.emit({
          action: axisConfig.action,
          type: isActive ? 'press' : 'release',
          value: isActive ? Math.abs(value) : 0,
          source: 'gamepad',
          timestamp: Date.now(),
        });
      }

      this.axisValues.set(index, value);
    });
  }

  // ============================================
  // State Queries
  // ============================================

  isKeyPressed(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  isActionPressed(action: InputAction): boolean {
    // Check keyboard
    for (const [code, mappedAction] of Object.entries(this.keyboardMapping)) {
      if (mappedAction === action && this.pressedKeys.has(code)) {
        return true;
      }
    }

    // Check gamepad buttons
    for (const [button, mappedAction] of Object.entries(this.gamepadMapping.buttons)) {
      if (mappedAction === action && this.pressedButtons.has(Number(button))) {
        return true;
      }
    }

    return false;
  }

  getConnectedGamepads(): Gamepad[] {
    return Array.from(navigator.getGamepads()).filter((g): g is Gamepad => g !== null);
  }

  // ============================================
  // Mapping Updates
  // ============================================

  updateKeyboardMapping(mapping: Record<string, InputAction>): void {
    this.keyboardMapping = mapping;
  }

  updateGamepadMapping(mapping: InputMapping['gamepad']): void {
    this.gamepadMapping = mapping;
  }
}

// ============================================
// Singleton Instance
// ============================================

let instance: ArcadeInputManager | null = null;

export function getArcadeInputManager(): ArcadeInputManager {
  if (!instance) {
    instance = new ArcadeInputManager();
  }
  return instance;
}

export function resetArcadeInputManager(): void {
  if (instance) {
    instance.stop();
    instance = null;
  }
}
