'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import {
  ArcadeInputManager,
  InputEvent,
  getArcadeInputManager,
} from '@/lib/arcade-input';
import { InputAction, InputMapping } from '@/lib/kiosk-config';

// ============================================
// Hook Types
// ============================================

export interface ArcadeInputCallbacks {
  onPress?: (action: InputAction, event: InputEvent) => void;
  onRelease?: (action: InputAction, event: InputEvent) => void;
  onAnyInput?: (event: InputEvent) => void;
}

export interface ArcadeInputState {
  isGamepadConnected: boolean;
  activeInputs: Set<InputAction>;
  lastInput: InputEvent | null;
}

// ============================================
// Main Hook
// ============================================

export function useArcadeInput(
  callbacks?: ArcadeInputCallbacks,
  options?: { enabled?: boolean; customMapping?: InputMapping }
): ArcadeInputState {
  const [state, setState] = useState<ArcadeInputState>({
    isGamepadConnected: false,
    activeInputs: new Set(),
    lastInput: null,
  });

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const manager = getArcadeInputManager();

    // Apply custom mapping if provided
    if (options?.customMapping) {
      manager.updateKeyboardMapping(options.customMapping.keyboard);
      manager.updateGamepadMapping(options.customMapping.gamepad);
    }

    // Start input manager
    manager.start();

    // Subscribe to input events
    const unsubscribe = manager.subscribe((event: InputEvent) => {
      setState((prev) => {
        const newActiveInputs = new Set(prev.activeInputs);

        if (event.type === 'press') {
          newActiveInputs.add(event.action);
          callbacksRef.current?.onPress?.(event.action, event);
        } else if (event.type === 'release') {
          newActiveInputs.delete(event.action);
          callbacksRef.current?.onRelease?.(event.action, event);
        }

        callbacksRef.current?.onAnyInput?.(event);

        return {
          ...prev,
          activeInputs: newActiveInputs,
          lastInput: event,
          isGamepadConnected: manager.getConnectedGamepads().length > 0,
        };
      });
    });

    // Check for initial gamepad state
    setState((prev) => ({
      ...prev,
      isGamepadConnected: manager.getConnectedGamepads().length > 0,
    }));

    return () => {
      unsubscribe();
    };
  }, [enabled, options?.customMapping]);

  return state;
}

// ============================================
// Specialized Action Hook
// ============================================

export function useArcadeAction(
  action: InputAction,
  onTrigger: () => void,
  options?: { triggerOnRepeat?: boolean; enabled?: boolean }
): boolean {
  const [isPressed, setIsPressed] = useState(false);
  const triggerOnRepeat = options?.triggerOnRepeat ?? false;
  const enabled = options?.enabled ?? true;

  useArcadeInput(
    {
      onPress: (pressedAction, event) => {
        if (pressedAction === action) {
          setIsPressed(true);
          onTrigger();
        }
      },
      onRelease: (releasedAction) => {
        if (releasedAction === action) {
          setIsPressed(false);
        }
      },
      onAnyInput: (event) => {
        if (triggerOnRepeat && event.action === action && event.type === 'repeat') {
          onTrigger();
        }
      },
    },
    { enabled }
  );

  return isPressed;
}

// ============================================
// Train Control Hook
// ============================================

export interface TrainControlState {
  throttle: number; // 0-100
  direction: 'forward' | 'reverse';
  isStopped: boolean;
}

export function useTrainControls(
  trainIndex: 1 | 2,
  onChange: (state: TrainControlState) => void,
  options?: { enabled?: boolean }
): TrainControlState {
  const [state, setState] = useState<TrainControlState>({
    throttle: 0,
    direction: 'forward',
    isStopped: true,
  });

  const throttleUpAction = trainIndex === 1 ? 'TRAIN_1_THROTTLE_UP' : 'TRAIN_2_THROTTLE_UP';
  const throttleDownAction = trainIndex === 1 ? 'TRAIN_1_THROTTLE_DOWN' : 'TRAIN_2_THROTTLE_DOWN';
  const reverseAction = trainIndex === 1 ? 'TRAIN_1_REVERSE' : 'TRAIN_2_REVERSE';
  const stopAction = trainIndex === 1 ? 'TRAIN_1_STOP' : 'TRAIN_2_STOP';

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const updateState = useCallback((updates: Partial<TrainControlState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      onChangeRef.current(newState);
      return newState;
    });
  }, []);

  useArcadeInput(
    {
      onPress: (action) => {
        switch (action) {
          case throttleUpAction:
            updateState({
              throttle: Math.min(state.throttle + 10, 100),
              isStopped: false,
            });
            break;
          case throttleDownAction:
            updateState({
              throttle: Math.max(state.throttle - 10, 0),
              isStopped: state.throttle <= 10,
            });
            break;
          case reverseAction:
            updateState({
              direction: state.direction === 'forward' ? 'reverse' : 'forward',
            });
            break;
          case stopAction:
            updateState({
              throttle: 0,
              isStopped: true,
            });
            break;
        }
      },
    },
    { enabled: options?.enabled ?? true }
  );

  return state;
}

// ============================================
// Camera Control Hook
// ============================================

export function useCameraControls(
  cameras: string[],
  onChange: (cameraId: string) => void,
  options?: { enabled?: boolean }
): string {
  const [currentIndex, setCurrentIndex] = useState(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleCameraChange = useCallback(
    (newIndex: number) => {
      const validIndex = Math.max(0, Math.min(newIndex, cameras.length - 1));
      setCurrentIndex(validIndex);
      onChangeRef.current(cameras[validIndex]);
    },
    [cameras]
  );

  useArcadeInput(
    {
      onPress: (action) => {
        switch (action) {
          case 'CAMERA_NEXT':
            handleCameraChange((currentIndex + 1) % cameras.length);
            break;
          case 'CAMERA_PREV':
            handleCameraChange((currentIndex - 1 + cameras.length) % cameras.length);
            break;
          case 'CAMERA_1':
            if (cameras.length >= 1) handleCameraChange(0);
            break;
          case 'CAMERA_2':
            if (cameras.length >= 2) handleCameraChange(1);
            break;
          case 'CAMERA_3':
            if (cameras.length >= 3) handleCameraChange(2);
            break;
          case 'CAMERA_4':
            if (cameras.length >= 4) handleCameraChange(3);
            break;
        }
      },
    },
    { enabled: options?.enabled ?? true }
  );

  return cameras[currentIndex];
}

// ============================================
// Emergency Stop Hook
// ============================================

export function useEmergencyStop(
  onEmergencyStop: () => void,
  options?: { enabled?: boolean }
): void {
  useArcadeAction('EMERGENCY_STOP', onEmergencyStop, options);
}

// ============================================
// Game Control Hook
// ============================================

export interface GameControlCallbacks {
  onStart?: () => void;
  onPause?: () => void;
  onModeSelect?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onCoinInsert?: () => void;
}

export function useGameControls(
  callbacks: GameControlCallbacks,
  options?: { enabled?: boolean }
): void {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useArcadeInput(
    {
      onPress: (action) => {
        switch (action) {
          case 'START_GAME':
            callbacksRef.current.onStart?.();
            break;
          case 'PAUSE_GAME':
            callbacksRef.current.onPause?.();
            break;
          case 'SELECT_MODE':
            callbacksRef.current.onModeSelect?.();
            break;
          case 'CONFIRM':
            callbacksRef.current.onConfirm?.();
            break;
          case 'CANCEL':
            callbacksRef.current.onCancel?.();
            break;
          case 'COIN_INSERT':
            callbacksRef.current.onCoinInsert?.();
            break;
        }
      },
    },
    { enabled: options?.enabled ?? true }
  );
}
