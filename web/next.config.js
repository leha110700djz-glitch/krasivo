/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Performance
  compress: true,
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/**' },
      { protocol: 'http', hostname: '10.0.2.2', port: '8000', pathname: '/**' },
      { protocol: 'http', hostname: '172.*', pathname: '/**' },
      { protocol: 'https', hostname: '**' },
    ],
    minimumCacheTTL: 3600,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },

  // Redirects for SEO
  async redirects() {
    return [
      { source: '/index', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
    ]
  },
}

module.exports = nextConfig
