import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================
// Production Security Middleware
// ============================================
// Adds security headers and request logging.

// Request counter for tracking
let requestCounter = 0;

export function middleware(request: NextRequest) {
  const start = Date.now();
  const id = ++requestCounter;
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

  // ============================================
  // Security Headers
  // ============================================

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - restrict powerful features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self), usb=()'
  );

  // DNS Prefetch Control
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Download Options (IE)
  response.headers.set('X-Download-Options', 'noopen');

  // Permitted Cross-Domain Policies
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // HSTS (Production Only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // ============================================
  // CORS Headers (for API routes and Capacitor)
  // ============================================

  if (isApiRoute) {
    const origin = request.nextUrl.origin;
    const allowedOrigins = [
      origin,
      'capacitor://localhost', // iOS Capacitor
      'http://localhost', // Android Capacitor
      'https://localhost', // Development
    ];

    const requestOrigin = request.headers.get('origin');

    if (requestOrigin && allowedOrigins.some((o) => requestOrigin.startsWith(o))) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, X-Admin-Key'
      );
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  // ============================================
  // Request Tracking
  // ============================================

  // Add request ID header for tracing
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-Id', requestId);

  // Add timing header
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);

  // Log response in development
  if (isApiRoute && isDev) {
    const duration = Date.now() - start;
    console.log(`\x1b[36m[${id}]\x1b[0m \x1b[32m✓\x1b[0m ${duration}ms`);
  }

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public folder static files
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|workbox-.*\\.js).*)',
  ],
};
