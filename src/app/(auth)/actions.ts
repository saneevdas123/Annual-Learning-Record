'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  hashPassword,
  verifyPassword,
} from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['STUDENT', 'FACULTY', 'MENTOR']).default('STUDENT'),
  registrationNumber: z.string().optional(),
});

async function setSession(user: { id: string; role: string; name: string }) {
  const token = await createSessionToken({ sub: user.id, role: user.role, name: user.name });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export type ActionState = { error?: string } | undefined;

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'Enter a valid email and password.' };

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.isActive) return { error: 'Invalid credentials or inactive account.' };

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { error: 'Invalid credentials.' };

  await setSession(user);
  redirect('/dashboard');
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role') || 'STUDENT',
    registrationNumber: formData.get('registrationNumber') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }
  const { name, email, password, role, registrationNumber } = parsed.data;

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return { error: 'An account with that email already exists.' };

  // The very first account created becomes an administrator.
  const count = await db.user.count();
  const finalRole = count === 0 ? 'ADMIN' : role;

  const user = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      role: finalRole,
      registrationNumber: registrationNumber || null,
    },
  });

  await setSession(user);
  redirect('/dashboard');
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect('/login');
}
