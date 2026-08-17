/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
