'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function acceptDeclaration() {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { eDeclarationAt: new Date() } });
  revalidatePath('/profile');
  revalidatePath('/dashboard');
}

export async function toggleMfa(formData: FormData) {
  const user = await requireUser();
  const enabled = String(formData.get('enabled')) === 'true';
  await db.user.update({ where: { id: user.id }, data: { mfaEnabled: enabled } });
  revalidatePath('/profile');
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const bio = String(formData.get('bio') ?? '');
  await db.user.update({ where: { id: user.id }, data: { bio } });
  revalidatePath('/profile');
}
