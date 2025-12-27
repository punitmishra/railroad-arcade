const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    // API routes - Network First (hardware control must always be live)
    {
      urlPattern: /^https?:\/\/.*\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60, // 1 minute
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Static JS/CSS - Cache First (fast loading)
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Fonts - Cache First
    {
      urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Images - Stale While Revalidate
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    // Pages - Network First (always show latest)
    {
      urlPattern: /^https?:\/\/[^/]+\/?$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow external images from OAuth providers and cloud storage
  images: {
    remotePatterns: [
      // OAuth provider avatars
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      // Cloud storage for user uploads
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      { protocol: 'https', hostname: '*.s3.*.amazonaws.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.storage.googleapis.com' },
      { protocol: 'https', hostname: '*.blob.core.windows.net' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  // API rewrites for development - proxy to Raspberry Pi control server
  // IMPORTANT: Exclude Next.js API routes (auth, db-test, payments, etc.)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/tracks/:path*',
        destination: `${apiUrl}/api/tracks/:path*`,
      },
      {
        source: '/api/cpx/:path*',
        destination: `${apiUrl}/api/cpx/:path*`,
      },
      {
        source: '/api/scenery/:path*',
        destination: `${apiUrl}/api/scenery/:path*`,
      },
      {
        source: '/api/camera/:path*',
        destination: `${apiUrl}/api/camera/:path*`,
      },
      {
        source: '/api/distance/:path*',
        destination: `${apiUrl}/api/distance/:path*`,
      },
      {
        source: '/api/status',
        destination: `${apiUrl}/api/status`,
      },
      {
        source: '/api/emergency-stop',
        destination: `${apiUrl}/api/emergency-stop`,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
