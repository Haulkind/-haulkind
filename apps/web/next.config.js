/** @type {import('next').NextConfig} */
/* Railway deploy trigger - snapshot timeout fix */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ESLint during builds can be enabled later
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 768, 1024, 1280, 1920],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|gif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Expires',
            value: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString(),
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://haulkind-production-285b.up.railway.app https://www.google-analytics.com https://analytics.google.com https://www.facebook.com https://connect.facebook.net https://www.clarity.ms https://nominatim.openstreetmap.org https://challenges.cloudflare.com",
              "frame-src https://js.stripe.com https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Catch-all for old/broken service URLs that don't match real pages
      { source: '/services', destination: '/quote', permanent: true },
      { source: '/junk-removal', destination: '/services/cleanout', permanent: true },
      { source: '/hauling', destination: '/services/cleanout', permanent: true },
      { source: '/labor', destination: '/services/moving-labor', permanent: true },
      { source: '/moving', destination: '/services/moving-labor', permanent: true },
      { source: '/moving-help', destination: '/services/moving-labor', permanent: true },
      { source: '/furniture-removal', destination: '/services/furniture', permanent: true },
      { source: '/appliance-removal', destination: '/services/appliances', permanent: true },
      { source: '/cleanout', destination: '/services/cleanout', permanent: true },
      { source: '/commercial', destination: '/services/commercial', permanent: true },
      { source: '/about', destination: '/how-it-works', permanent: true },
      { source: '/about-us', destination: '/how-it-works', permanent: true },
    ]
  },
};

module.exports = nextConfig;
