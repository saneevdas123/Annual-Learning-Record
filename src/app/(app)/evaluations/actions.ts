'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { ALR_CREDITS_PER_YEAR } from '@/lib/domain';
import { fail, ok } from '@/lib/action-result';
import { assertStudentInScope } from '@/lib/access';
import { sendMailSafe, yearSignedEmail } from '@/lib/mailer';
import { getSiteUrl } from '@/lib/site';

const rubricSchema = z.object({
  studentId: z.string().min(1),
  academicYear: z.string().min(1),
  coverageCourses: z.coerce.number().min(0).max(20),
  coverageComponents: z.coerce.number().min(0).max(20),
  qualityContent: z.coerce.number().min(0).max(20),
  aesthetics: z.coerce.number().min(0).max(20),
  presentation: z.coerce.number().min(0).max(20),
});

export async function saveYearEvaluation(formData: FormData): Promise<void> {
  const user = await requireRole('HOD', 'DEAN', 'ADMIN');
  const parsed = rubricSchema.safeParse({
    studentId: formData.get('studentId'),
    academicYear: formData.get('academicYear'),
    coverageCourses: formData.get('coverageCourses'),
    coverageComponents: formData.get('coverageComponents'),
    qualityContent: formData.get('qualityContent'),
    aesthetics: formData.get('aesthetics'),
    presentation: formData.get('presentation'),
  });
  if (!parsed.success) return fail('Check the rubric scores.');
  const p = parsed.data;
  try {
    await assertStudentInScope(user, p.studentId);
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Student is outside your organisation.');
  }
  const total =
    p.coverageCourses + p.coverageComponents + p.qualityContent + p.aesthetics + p.presentation;

  await db.yearEvaluation.upsert({
    where: { studentId_academicYear: { studentId: p.studentId, academicYear: p.academicYear } },
    create: {
      studentId: p.studentId,
      academicYear: p.academicYear,
      status: 'IN_REVIEW',
      coverageCourses: p.coverageCourses,
      coverageComponents: p.coverageComponents,
      qualityContent: p.qualityContent,
      aesthetics: p.aesthetics,
      presentation: p.presentation,
      totalMark: total,
    },
    update: {
      status: 'IN_REVIEW',
      coverageCourses: p.coverageCourses,
      coverageComponents: p.coverageComponents,
      qualityContent: p.qualityContent,
      aesthetics: p.aesthetics,
      presentation: p.presentation,
      totalMark: total,
    },
  });
  revalidatePath('/evaluations');
  return ok();
}

export async function signoffYearEvaluation(formData: FormData): Promise<void> {
  const user = await requireRole('HOD', 'DEAN', 'ADMIN');
  const studentId = String(formData.get('studentId'));
  const academicYear = String(formData.get('academicYear'));
  try {
    await assertStudentInScope(user, studentId);
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Student is outside your organisation.');
  }

  const evaln = await db.yearEvaluation.findUnique({
    where: { studentId_academicYear: { studentId, academicYear } },
  });
  if (!evaln || evaln.totalMark == null) return fail('Score the rubric before signing off.');

  await db.yearEvaluation.update({
    where: { studentId_academicYear: { studentId, academicYear } },
    data: { status: 'SIGNED_OFF', creditAwarded: ALR_CREDITS_PER_YEAR },
  });

  await db.creditLedgerEntry.upsert({
    where: {
      studentId_academicYear_source: { studentId, academicYear, source: 'ALR' },
    },
    create: {
      studentId,
      academicYear,
      credits: ALR_CREDITS_PER_YEAR,
      basket: 'COMPULSORY',
      source: 'ALR',
    },
    update: { credits: ALR_CREDITS_PER_YEAR },
  });

  await db.notification.create({
    data: {
      userId: studentId,
      title: 'Annual record signed off',
      message: `Your ${academicYear} learning record was signed off and 1 credit posted.`,
      link: '/credits',
    },
  });

  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { name: true, email: true },
  });
  const mail = yearSignedEmail({
    studentName: student?.name,
    academicYear,
    dashboardUrl: `${getSiteUrl()}/credits`,
  });
  await sendMailSafe({ to: student?.email, ...mail });

  revalidatePath('/evaluations');
  revalidatePath('/credits');
  return ok();
}

export async function exportYearEvaluation(formData: FormData): Promise<void> {
  const user = await requireRole('DEAN', 'ADMIN');
  const studentId = String(formData.get('studentId'));
  const academicYear = String(formData.get('academicYear'));
  try {
    await assertStudentInScope(user, studentId);
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Student is outside your organisation.');
  }

  await db.yearEvaluation.update({
    where: { studentId_academicYear: { studentId, academicYear } },
    data: { status: 'EXPORTED', examCellExportAt: new Date() },
  });
  await db.creditLedgerEntry.updateMany({
    where: { studentId, academicYear, source: 'ALR' },
    data: { examCellRef: `EXAMCELL-${academicYear}-${studentId.slice(-6).toUpperCase()}` },
  });
  revalidatePath('/evaluations');
  return ok();
}

export async function compileProgramEvaluation(formData: FormData): Promise<void> {
  const user = await requireRole('DEAN', 'ADMIN');
  const studentId = String(formData.get('studentId'));
  try {
    await assertStudentInScope(user, studentId);
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Student is outside your organisation.');
  }

  const years = await db.yearEvaluation.findMany({
    where: { studentId, status: { in: ['SIGNED_OFF', 'EXPORTED'] } },
  });
  const marks = years.map((y) => y.totalMark ?? 0);
  const cumulated = marks.reduce((a, b) => a + b, 0);
  const finalMark = marks.length ? Number((cumulated / marks.length).toFixed(2)) : 0;
  const creditTotal = years.reduce((a, y) => a + (y.creditAwarded ?? 0), 0);

  await db.programEvaluation.upsert({
    where: { studentId },
    create: { studentId, status: 'IN_REVIEW', cumulatedMark: cumulated, finalMark, creditTotal },
    update: { status: 'IN_REVIEW', cumulatedMark: cumulated, finalMark, creditTotal },
  });
  revalidatePath('/evaluations');
  return ok();
}

export async function exportProgramEvaluation(formData: FormData): Promise<void> {
  const user = await requireRole('DEAN', 'ADMIN');
  const studentId = String(formData.get('studentId'));
  try {
    await assertStudentInScope(user, studentId);
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Student is outside your organisation.');
  }
  await db.programEvaluation.update({
    where: { studentId },
    data: { status: 'EXPORTED', examCellExportAt: new Date() },
  });
  revalidatePath('/evaluations');
  return ok();
}
