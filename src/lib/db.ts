import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function withOneConnection(url: string) {
  if (!url) return url;
  const withoutLimit = url
    .replace(/([?&])connection_limit=\d+/g, '$1')
    .replace(/[?&]pool_timeout=\d+/g, '')
    .replace(/\?&/, '?')
    .replace(/[?&]$/, '');
  const sep = withoutLimit.includes('?') ? '&' : '?';
  return `${withoutLimit}${sep}connection_limit=1&pool_timeout=20`;
}

function createClient() {
  return new PrismaClient({
    datasources: { db: { url: withOneConnection(process.env.DATABASE_URL ?? '') } },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

/** One PrismaClient for the whole Node process — not per request. */
export const db: PrismaClient = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = db;
