/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone is for Docker. On Vercel, Next 16.3 + standalone skips
  // next-server.js.nft.json and onBuildComplete then fails with ENOENT.
  output: process.env.VERCEL ? undefined : 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: [
    '@prisma/client',
    'bcryptjs',
    'nodemailer',
    '@langchain/core',
    '@langchain/openai',
    '@langchain/anthropic',
    '@langchain/langgraph',
  ],
};

export default nextConfig;
