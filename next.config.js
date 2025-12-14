/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

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

module.exports = nextConfig;
