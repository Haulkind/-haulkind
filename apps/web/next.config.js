/** @type {import('next').NextConfig} */
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
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
