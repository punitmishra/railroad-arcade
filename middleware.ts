import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================
// Middleware with Request Logging
// ============================================
// Logs API requests in development for debugging.
// In production, this can be extended to send logs
// to an external service.

// Request counter for tracking
let requestId = 0;

export function middleware(request: NextRequest) {
  const start = Date.now();
  const id = ++requestId;
  const { pathname, search } = request.nextUrl;
  const method = request.method;

  // Only log API routes in development
  const isApiRoute = pathname.startsWith('/api/');
  const isDev = process.env.NODE_ENV === 'development';

  if (isApiRoute && isDev) {
    console.log(
      `\x1b[36m[${id}]\x1b[0m \x1b[33m${method}\x1b[0m ${pathname}${search}`
    );
  }

  // Create response
  const response = NextResponse.next();

  // Add request ID header for tracing
  response.headers.set('x-request-id', id.toString());

  // Add timing header
  response.headers.set('x-response-time', `${Date.now() - start}ms`);

  // Log response in development
  if (isApiRoute && isDev) {
    // Use setTimeout to log after response is processed
    const duration = Date.now() - start;
    console.log(
      `\x1b[36m[${id}]\x1b[0m \x1b[32m✓\x1b[0m ${duration}ms`
    );
  }

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Optionally match other routes for additional middleware
    // '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
