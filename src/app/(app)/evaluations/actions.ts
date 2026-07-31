'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { ALR_CREDITS_PER_YEAR } from '@/lib/domain';

// ---------------------------------------------------------------------------
// Year-wise evaluation (Framework tier 2): the Dean's committee scores the
// annual record against the 5-criterion / 100-mark rubric, signs off, awards
// the 1 credit into the Compulsory Basket, and exports to the exam cell.
// ---------------------------------------------------------------------------

const rubricSchema = z.object({
  studentId: z.string().min(1),
  academicYear: z.string().min(1),
  coverageCourses: z.coerce.number().min(0).max(20),
  coverageComponents: z.coerce.number().min(0).max(20),
  qualityContent: z.coerce.number().min(0).max(20),
  aesthetics: z.coerce.number().min(0).max(20),
  presentation: z.coerce.number().min(0).max(20),
});

export async function saveYearEvaluation(formData: FormData) {
  await requireRole('HOD', 'DEAN', 'ADMIN');
  const p = rubricSchema.parse({
    studentId: formData.get('studentId'),
    academicYear: formData.get('academicYear'),
    coverageCourses: formData.get('coverageCourses'),
    coverageComponents: formData.get('coverageComponents'),
    qualityContent: formData.get('qualityContent'),
    aesthetics: formData.get('aesthetics'),
    presentation: formData.get('presentation'),
  });
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
}

// Sign off the year evaluation and post the annual credit to the ledger.
export async function signoffYearEvaluation(formData: FormData) {
  const user = await requireRole('HOD', 'DEAN', 'ADMIN');
  const studentId = String(formData.get('studentId'));
  const academicYear = String(formData.get('academicYear'));

  const evaln = await db.yearEvaluation.findUnique({
    where: { studentId_academicYear: { studentId, academicYear } },
  });
  if (!evaln || evaln.totalMark == null) throw new Error('Score the rubric before signing off.');

  await db.yearEvaluation.update({
    where: { studentId_academicYear: { studentId, academicYear } },
    data: { status: 'SIGNED_OFF', creditAwarded: ALR_CREDITS_PER_YEAR },
  });

  // Post the credit (idempotent on [studentId, academicYear, source]).
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

  revalidatePath('/evaluations');
  revalidatePath('/credits');
}

// Export a signed-off evaluation to the exam cell (records the export stamp).
export async function exportYearEvaluation(formData: FormData) {
  await requireRole('DEAN', 'ADMIN');
  const studentId = String(formData.get('studentId'));
  const academicYear = String(formData.get('academicYear'));

  await db.yearEvaluation.update({
    where: { studentId_academicYear: { studentId, academicYear } },
    data: { status: 'EXPORTED', examCellExportAt: new Date() },
  });
  await db.creditLedgerEntry.updateMany({
    where: { studentId, academicYear, source: 'ALR' },
    data: { examCellRef: `EXAMCELL-${academicYear}-${studentId.slice(-6).toUpperCase()}` },
  });
  revalidatePath('/evaluations');
}

// ---------------------------------------------------------------------------
// Program-wise evaluation (Framework tier 3): cumulate all signed-off annual
// marks into a final program mark + total credit, then export.
// ---------------------------------------------------------------------------

export async function compileProgramEvaluation(formData: FormData) {
  await requireRole('DEAN', 'ADMIN');
  const studentId = String(formData.get('studentId'));

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
}

export async function exportProgramEvaluation(formData: FormData) {
  await requireRole('DEAN', 'ADMIN');
  const studentId = String(formData.get('studentId'));
  await db.programEvaluation.update({
    where: { studentId },
    data: { status: 'EXPORTED', examCellExportAt: new Date() },
  });
  revalidatePath('/evaluations');
}
