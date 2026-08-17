import { randomBytes } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getAuthSecret } from './env';

const ALG = 'HS256';

function secretKey() {
  return new TextEncoder().encode(getAuthSecret());
}

export const SESSION_COOKIE = 'alr_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string; // user id
  role: string;
  name: string;
  mustChangePassword?: boolean;
  [key: string]: unknown;
}

export function generateTempPassword() {
  return `Cutm-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export function allowedUniversityEmail(email: string) {
  const domain = (process.env.ALLOWED_EMAIL_DOMAIN ?? 'cutm.ac.in').trim().toLowerCase();
  if (!domain) return true;
  return email.toLowerCase().endsWith(`@${domain}`);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
