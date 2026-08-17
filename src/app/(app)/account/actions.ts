'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/session';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  hashPassword,
  verifyPassword,
} from '@/lib/auth';
import { fail, ok } from '@/lib/action-result';

export async function changePassword(formData: FormData): Promise<void> {
  const user = await requireUser();
  const current = String(formData.get('currentPassword') ?? '');
  const next = String(formData.get('newPassword') ?? '');
  const confirm = String(formData.get('confirmPassword') ?? '');

  if (next.length < 8) return fail('New password must be at least 8 characters.');
  if (next !== confirm) return fail('New password and confirmation do not match.');
  if (current === next) return fail('Choose a password that is different from the current one.');

  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!row) return fail('Account not found.');
  const matches = await verifyPassword(current, row.passwordHash);
  if (!matches) return fail('Current password is incorrect.');

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false },
  });

  const token = await createSessionToken({
    sub: user.id,
    role: user.role,
    name: user.name,
    mustChangePassword: false,
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  redirect('/dashboard');
}

export async function changePasswordFromProfile(formData: FormData): Promise<void> {
  const user = await requireUser();
  const current = String(formData.get('currentPassword') ?? '');
  const next = String(formData.get('newPassword') ?? '');
  const confirm = String(formData.get('confirmPassword') ?? '');

  if (next.length < 8) return fail('New password must be at least 8 characters.');
  if (next !== confirm) return fail('New password and confirmation do not match.');

  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!row) return fail('Account not found.');
  const matches = await verifyPassword(current, row.passwordHash);
  if (!matches) return fail('Current password is incorrect.');

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false },
  });
  return ok();
}
