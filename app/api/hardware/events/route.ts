// ============================================
// Hardware Events SSE Endpoint
// ============================================
// Streams real-time hardware state updates to clients.
// Automatically starts/stops polling based on connected clients.

import { NextRequest } from 'next/server';
import { realtimeEmitter, HardwareStateData } from '@/lib/realtime';
import {
  registerPollingClient,
  unregisterPollingClient,
  getPollingStatus,
} from '@/lib/hardware-polling';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type HardwareEventType =
  | 'hardware_state'
  | 'sensor_update'
  | 'cpx_update'
  | 'camera_update';

const HARDWARE_EVENT_TYPES: HardwareEventType[] = [
  'hardware_state',
  'sensor_update',
  'cpx_update',
  'camera_update',
];

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let isClosed = false;
  let heartbeat: NodeJS.Timeout | null = null;
  const unsubscribeFns: (() => void)[] = [];

  // Parse optional filter parameter
  const filterParam = request.nextUrl.searchParams.get('filter');
  const eventFilter = filterParam
    ? (filterParam.split(',') as HardwareEventType[])
    : HARDWARE_EVENT_TYPES;

  const stream = new ReadableStream({
    start(controller) {
      // Register as a polling client
      registerPollingClient();

      // Send initial connection event with current status
      const status = getPollingStatus();
      const connectEvent = `data: ${JSON.stringify({
        type: 'connected',
        timestamp: Date.now(),
        isPolling: status.isPolling,
        clientCount: status.clientCount,
      })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // If we have cached status, send it immediately
      if (status.lastStatus) {
        const initialState: HardwareStateData = {
          controllerOnline: status.lastStatus.controller,
          cpxConnected: status.lastStatus.cpx,
          cameraRunning: status.lastStatus.camera,
          tracks: status.lastStatus.tracks.map((t) => ({
            id: t.id,
            speed: t.speed,
            direction: t.direction,
            running: t.running,
          })),
          lastUpdated: Date.now(),
        };

        const initialEvent = `data: ${JSON.stringify({
          type: 'hardware_state',
          data: initialState,
          timestamp: Date.now(),
        })}\n\n`;
        controller.enqueue(encoder.encode(initialEvent));
      }

      // Subscribe to hardware events
      for (const eventType of eventFilter) {
        const unsubscribe = realtimeEmitter.subscribe(eventType, (event) => {
          if (isClosed) return;
          try {
            const sseData = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          } catch {
            // Stream closed, ignore
          }
        });
        unsubscribeFns.push(unsubscribe);
      }

      // Heartbeat to keep connection alive
      heartbeat = setInterval(() => {
        if (isClosed) {
          if (heartbeat) clearInterval(heartbeat);
          return;
        }
        const ping = `data: ${JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
        })}\n\n`;
        try {
          controller.enqueue(encoder.encode(ping));
        } catch {
          // Stream closed, cleanup
          isClosed = true;
          cleanup();
        }
      }, 15000); // 15 second heartbeat for hardware events
    },

    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    isClosed = true;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
    unsubscribeFns.forEach((unsub) => unsub());
    unregisterPollingClient();
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
