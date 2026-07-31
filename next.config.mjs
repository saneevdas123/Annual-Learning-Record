/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained build for cheap container/host deploys.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Prisma is a server-only dependency; keep it out of the client bundle.
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
};

export default nextConfig;
