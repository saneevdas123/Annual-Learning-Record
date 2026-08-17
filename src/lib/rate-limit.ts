import { headers } from 'next/headers';

type Bucket = { n: number; reset: number };

const buckets = new Map<string, Bucket>();

export async function clientKey(scope: string) {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || h.get('x-real-ip') || 'local';
  return `${scope}:${ip}`;
}

export function assertRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return;
  }
  bucket.n += 1;
  if (bucket.n > max) {
    throw new Error('Too many attempts. Please wait a minute and try again.');
  }
}
