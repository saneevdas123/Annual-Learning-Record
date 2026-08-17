'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { ok } from '@/lib/action-result';

export async function acceptDeclaration(): Promise<void> {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { eDeclarationAt: new Date() } });
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  return ok();
}

export async function updateProfile(formData: FormData): Promise<void> {
  const user = await requireUser();
  const bio = String(formData.get('bio') ?? '');
  await db.user.update({ where: { id: user.id }, data: { bio } });
  revalidatePath('/profile');
  return ok();
}

