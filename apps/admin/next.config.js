/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@haulkind/shared'],
  output: 'standalone',
  basePath: '/admin',
  assetPrefix: '/admin',
};

module.exports = nextConfig;
