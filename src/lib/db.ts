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
  // One PrismaClient (singleton). A tiny pool lets layout + page query together
  // so client navigations are not stuck behind a single serial connection.
  return `${withoutLimit}${sep}connection_limit=3&pool_timeout=20`;
}

function createClient() {
  const url = withOneConnection(process.env.DATABASE_URL ?? '');
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Process-wide singleton. The client is created on the first query so
 * `next build` / Docker can finish without DATABASE_URL.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
