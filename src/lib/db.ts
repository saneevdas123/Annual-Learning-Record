import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across hot-reloads and serverless invocations.
// Cost/scale note: one pooled client per instance keeps DB connections bounded;
// point DATABASE_URL at a pooler (PgBouncer / Neon / Supabase pooling) in prod.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function datasourceUrl() {
  const url = process.env.DATABASE_URL ?? '';
  if (!url || /[?&]connection_limit=/.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  const limit = process.env.NODE_ENV === 'production' ? '5' : '3';
  return `${url}${sep}connection_limit=${limit}&pool_timeout=15`;
}

function create() {
  return new PrismaClient({
    datasources: { db: { url: datasourceUrl() } },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

let client: PrismaClient | undefined;
function getClient(): PrismaClient {
  if (!client) {
    client = globalForPrisma.prisma ?? create();
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
  }
  return client;
}

// Lazy proxy: construction is deferred until the first query at request time,
// so importing `db` never connects (and never throws) during the build step.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = getClient() as unknown as Record<string | symbol, unknown>;
    const value = c[prop];
    return typeof value === 'function' ? value.bind(c) : value;
  },
});
