/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ESLint during builds can be enabled later
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
