'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

// External industry supervisor submits an assessment using only a signed token —
// no account required (finding s). The token authorizes exactly one deliverable.
export async function submitIndustryAssessment(formData: FormData) {
  const token = String(formData.get('token'));
  const externalScore = Number(formData.get('externalScore') ?? 0) || 0;
  const feedback = String(formData.get('feedback') ?? '');

  const rec = await db.industryToken.findUnique({ where: { token } });
  if (!rec) throw new Error('Invalid token');
  if (rec.expiresAt < new Date()) throw new Error('This link has expired.');

  const deliverable = await db.deliverable.findUnique({ where: { id: rec.deliverableId } });
  if (!deliverable) throw new Error('Deliverable not found');

  const rubric = (deliverable.rubric as Record<string, unknown> | null) ?? {};
  await db.deliverable.update({
    where: { id: rec.deliverableId },
    data: {
      externalScore,
      rubric: { ...rubric, industryFeedback: feedback, industrySupervisorEmail: rec.email },
    },
  });
  await db.industryToken.update({ where: { token }, data: { usedAt: new Date() } });

  revalidatePath(`/industry/${token}`);
}
