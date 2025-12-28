'use client';

// ============================================
// Hardware Real-Time Hook
// ============================================
// Subscribes to hardware SSE events and provides
// real-time state updates for hardware components.

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  HardwareStateData,
  SensorUpdateData,
  CpxUpdateData,
  CameraUpdateData,
} from '@/lib/realtime';

export interface HardwareRealtimeState {
  // Connection status
  connected: boolean;
  isPolling: boolean;

  // Hardware state
  controllerOnline: boolean;
  cpxConnected: boolean;
  cameraRunning: boolean;

  // Tracks
  tracks: Array<{
    id: string;
    speed: number;
    direction: 'forward' | 'reverse' | 'stop';
    running: boolean;
  }>;

  // Sensors
  distanceSensors: Array<{
    name: string;
    value: number;
    blocked: boolean;
  }>;
  ldrSensors: Array<{
    name: string;
    value: number;
    blocked: boolean;
  }>;

  // CPX
  cpx: CpxUpdateData | null;

  // Camera
  camera: CameraUpdateData | null;

  // Timestamps
  lastHardwareUpdate: number | null;
  lastSensorUpdate: number | null;
}

export interface UseHardwareRealtimeOptions {
  enabled?: boolean;
  filter?: Array<
    'hardware_state' | 'sensor_update' | 'cpx_update' | 'camera_update'
  >;
  onHardwareState?: (data: HardwareStateData) => void;
  onSensorUpdate?: (data: SensorUpdateData) => void;
  onCpxUpdate?: (data: CpxUpdateData) => void;
  onCameraUpdate?: (data: CameraUpdateData) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useHardwareRealtime(
  options: UseHardwareRealtimeOptions = {}
): HardwareRealtimeState & {
  reconnect: () => void;
} {
  const {
    enabled = true,
    filter,
    onHardwareState,
    onSensorUpdate,
    onCpxUpdate,
    onCameraUpdate,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [state, setState] = useState<HardwareRealtimeState>({
    connected: false,
    isPolling: false,
    controllerOnline: false,
    cpxConnected: false,
    cameraRunning: false,
    tracks: [],
    distanceSensors: [],
    ldrSensors: [],
    cpx: null,
    camera: null,
    lastHardwareUpdate: null,
    lastSensorUpdate: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Build URL with optional filter
    let url = '/api/hardware/events';
    if (filter && filter.length > 0) {
      url += `?filter=${filter.join(',')}`;
    }

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      reconnectAttemptsRef.current = 0;
      onConnect?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            setState((prev) => ({
              ...prev,
              connected: true,
              isPolling: data.isPolling,
            }));
            break;

          case 'hardware_state': {
            const hwData = data.data as HardwareStateData;
            setState((prev) => ({
              ...prev,
              controllerOnline: hwData.controllerOnline,
              cpxConnected: hwData.cpxConnected,
              cameraRunning: hwData.cameraRunning,
              tracks: hwData.tracks,
              lastHardwareUpdate: hwData.lastUpdated,
            }));
            onHardwareState?.(hwData);
            break;
          }

          case 'sensor_update': {
            const sensorData = data.data as SensorUpdateData;
            setState((prev) => {
              if (sensorData.type === 'distance') {
                return {
                  ...prev,
                  distanceSensors: sensorData.sensors,
                  lastSensorUpdate: data.timestamp,
                };
              } else if (sensorData.type === 'ldr') {
                return {
                  ...prev,
                  ldrSensors: sensorData.sensors,
                  lastSensorUpdate: data.timestamp,
                };
              }
              return prev;
            });
            onSensorUpdate?.(sensorData);
            break;
          }

          case 'cpx_update': {
            const cpxData = data.data as CpxUpdateData;
            setState((prev) => ({
              ...prev,
              cpx: cpxData,
              cpxConnected: cpxData.connected,
            }));
            onCpxUpdate?.(cpxData);
            break;
          }

          case 'camera_update': {
            const camData = data.data as CameraUpdateData;
            setState((prev) => ({
              ...prev,
              camera: camData,
              cameraRunning: camData.running,
            }));
            onCameraUpdate?.(camData);
            break;
          }

          case 'ping':
            // Just keep connection alive
            break;
        }
      } catch (error) {
        console.error('[useHardwareRealtime] Error parsing event:', error);
      }
    };

    eventSource.onerror = () => {
      setState((prev) => ({ ...prev, connected: false }));
      onDisconnect?.();
      eventSource.close();
      eventSourceRef.current = null;

      // Attempt reconnection
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        const delay = RECONNECT_DELAY * reconnectAttemptsRef.current;
        console.log(
          `[useHardwareRealtime] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`
        );
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      } else {
        onError?.(
          new Error(
            `Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`
          )
        );
      }
    };
  }, [
    filter,
    onConnect,
    onDisconnect,
    onError,
    onHardwareState,
    onSensorUpdate,
    onCpxUpdate,
    onCameraUpdate,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState((prev) => ({ ...prev, connected: false }));
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    ...state,
    reconnect,
  };
}

/**
 * Convenience hook for just sensor data
 */
export function useSensorRealtime(
  options: Omit<UseHardwareRealtimeOptions, 'filter'> = {}
) {
  return useHardwareRealtime({
    ...options,
    filter: ['sensor_update'],
  });
}

/**
 * Convenience hook for just track/train data
 */
export function useTrackRealtime(
  options: Omit<UseHardwareRealtimeOptions, 'filter'> = {}
) {
  return useHardwareRealtime({
    ...options,
    filter: ['hardware_state'],
  });
}
