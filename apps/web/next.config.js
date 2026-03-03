/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ESLint during builds can be enabled later
    ignoreDuringBuilds: true,
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
