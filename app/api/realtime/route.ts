// ============================================
// Real-Time Updates API (Server-Sent Events)
// ============================================
// Provides SSE endpoint for real-time updates

import { NextRequest } from 'next/server';
import { createSSEStream, RealtimeEventType } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Parse event types from query params
  const eventTypesParam = request.nextUrl.searchParams.getAll('events');
  const eventTypes = eventTypesParam.length > 0
    ? (eventTypesParam as RealtimeEventType[])
    : undefined;

  // Create SSE stream
  const stream = createSSEStream(eventTypes);

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
