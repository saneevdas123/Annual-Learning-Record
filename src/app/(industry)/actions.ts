'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { fail, ok } from '@/lib/action-result';
import { assertRateLimit, clientKey } from '@/lib/rate-limit';

export async function submitIndustryAssessment(formData: FormData): Promise<void> {
  try {
    assertRateLimit(await clientKey('industry'), 10, 60_000);
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Too many attempts.');
  }
  const token = String(formData.get('token'));
  const externalScore = Number(formData.get('externalScore') ?? 0) || 0;
  const feedback = String(formData.get('feedback') ?? '');

  const rec = await db.industryToken.findUnique({ where: { token } });
  if (!rec) return fail('Invalid token.');
  if (rec.expiresAt < new Date()) return fail('This link has expired.');
  if (rec.usedAt) return fail('This assessment has already been submitted.');

  const deliverable = await db.deliverable.findUnique({ where: { id: rec.deliverableId } });
  if (!deliverable) return fail('Deliverable not found.');

  const rubric = (deliverable.rubric as Record<string, unknown> | null) ?? {};
  try {
    await db.$transaction([
      db.deliverable.update({
        where: { id: rec.deliverableId },
        data: {
          externalScore,
          rubric: { ...rubric, industryFeedback: feedback, industrySupervisorEmail: rec.email },
        },
      }),
      db.industryToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);
  } catch {
    return fail('Could not submit the assessment.');
  }

  revalidatePath(`/industry/${token}`);
  return ok();
}
