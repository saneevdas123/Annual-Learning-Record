'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { RECORD_TYPES, normalizeToWeight, type RecordType } from '@/lib/domain';
import { aiScoreRecord, aiEnabled } from '@/lib/ai';
import {
  assertDeclaration,
  assertStudentEnrolled,
  canActOnStep,
  canReviewRecord,
  currentSignoffStep,
  findActorForStep,
  loadRecordForAccess,
  recordTypeAllowedForCourse,
} from '@/lib/access';
import { fail, ok } from '@/lib/action-result';
import {
  appealFiledEmail,
  appealResolvedEmail,
  recordDecisionEmail,
  recordSubmittedEmail,
  sendMailSafe,
} from '@/lib/mailer';
import { getSiteUrl } from '@/lib/site';

const createSchema = z.object({
  courseId: z.string().min(1),
  recordType: z.string().min(1),
  title: z.string().min(2),
  description: z.string().default(''),
  booksReferred: z.string().optional(),
});

export async function createRecord(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.role !== 'STUDENT') return fail('Only students file records.');
  try {
    assertDeclaration(user);
    const parsed = createSchema.parse({
      courseId: formData.get('courseId'),
      recordType: formData.get('recordType'),
      title: formData.get('title'),
      description: formData.get('description') ?? '',
      booksReferred: formData.get('booksReferred') ?? undefined,
    });

    const course = await db.course.findUnique({ where: { id: parsed.courseId } });
    if (!course) return fail('Course not found.');
    await assertStudentEnrolled(user.id, parsed.courseId);
    if (!recordTypeAllowedForCourse(course.combinationCode, parsed.recordType)) {
      return fail('That record type is not required for this course.');
    }

    const existing = await db.learningRecord.findFirst({
      where: { studentId: user.id, courseId: parsed.courseId, recordType: parsed.recordType as RecordType },
    });
    if (existing) redirect(`/records/${existing.id}`);

    const spec = RECORD_TYPES[parsed.recordType as RecordType];
    const record = await db.learningRecord.create({
      data: {
        studentId: user.id,
        courseId: parsed.courseId,
        recordType: parsed.recordType as RecordType,
        academicYear: course.academicYear,
        term: course.term,
        title: parsed.title,
        description: parsed.description,
        booksReferred: parsed.booksReferred || null,
        subjectWeightPct: spec.weightPct,
        perEntryMax: spec.perEntryMax,
      },
    });
    revalidatePath('/records');
    redirect(`/records/${record.id}`);
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e;
    return fail(e instanceof Error ? e.message : 'Could not create the record.');
  }
}

const LOCKED_ENTRY = new Set(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']);

export async function addEntry(formData: FormData): Promise<void> {
  const user = await requireUser();
  const recordId = String(formData.get('recordId'));
  const record = await db.learningRecord.findUnique({ where: { id: recordId } });
  if (!record || record.studentId !== user.id) return fail('Record not found.');
  if (LOCKED_ENTRY.has(record.status)) return fail('This record can no longer be edited.');

  const spec = RECORD_TYPES[record.recordType as RecordType];
  const rubricScores: Record<string, number> = {};
  let rawScore = 0;
  for (const c of spec.rubric) {
    const v = Number(formData.get(`rubric_${c.criterion}`) ?? 0) || 0;
    rubricScores[c.criterion] = v;
    rawScore += v;
  }

  await db.recordEntry.create({
    data: {
      recordId,
      title: String(formData.get('entryTitle') ?? 'Entry'),
      content: String(formData.get('entryContent') ?? ''),
      rubricScores,
      rawScore,
      maxScore: spec.perEntryMax,
      hoursLogged: spec.hoursBased ? Number(formData.get('hours') ?? 0) || 0 : null,
    },
  });
  revalidatePath(`/records/${recordId}`);
  return ok();
}

export async function submitRecord(formData: FormData): Promise<void> {
  const user = await requireUser();
  try {
    assertDeclaration(user);
    const recordId = String(formData.get('recordId'));
    const record = await db.learningRecord.findUnique({
      where: { id: recordId },
      include: { course: true, student: true },
    });
    if (!record || record.studentId !== user.id) return fail('Record not found.');
    if (!['DRAFT', 'REVISION'].includes(record.status)) return fail('This record is not ready to submit.');

    await db.$transaction(async (tx) => {
      await tx.learningRecord.update({
        where: { id: recordId },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
      });
      const existingSteps = await tx.signoffStep.count({
        where: { target: 'LEARNING_RECORD', targetId: recordId },
      });
      if (existingSteps === 0) {
        await tx.signoffStep.createMany({
          data: [
            { target: 'LEARNING_RECORD', targetId: recordId, stepOrder: 1, role: 'FACULTY' },
            { target: 'LEARNING_RECORD', targetId: recordId, stepOrder: 2, role: 'MENTOR' },
            { target: 'LEARNING_RECORD', targetId: recordId, stepOrder: 3, role: 'HOD' },
          ],
        });
      } else {
        await tx.signoffStep.updateMany({
          where: { target: 'LEARNING_RECORD', targetId: recordId },
          data: { status: 'PENDING', signerId: null, signedAt: null },
        });
      }
      await tx.notification.create({
        data: {
          userId: record.course.facultyId,
          title: 'Record submitted for review',
          message: `${record.student.name} submitted "${record.title}".`,
          link: `/records/${recordId}`,
        },
      });
    });

    const faculty = await db.user.findUnique({
      where: { id: record.course.facultyId },
      select: { name: true, email: true },
    });
    const mail = recordSubmittedEmail({
      reviewerName: faculty?.name,
      studentName: record.student.name,
      title: record.title,
      courseLabel: `${record.course.code} · ${record.course.title}`,
      dashboardUrl: `${getSiteUrl()}/records/${recordId}`,
    });
    await sendMailSafe({ to: faculty?.email, ...mail });

    revalidatePath(`/records/${recordId}`);
    revalidatePath('/records');
    revalidatePath('/review');
    return ok();
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e;
    return fail(e instanceof Error ? e.message : 'Could not submit the record.');
  }
}

export async function requestAiScore(formData: FormData): Promise<void> {
  const user = await requireUser();
  const recordId = String(formData.get('recordId'));
  if (!aiEnabled) return fail('AI scoring is not configured.');

  const record = await loadRecordForAccess(recordId);
  if (!record) return fail('Record not found.');
  if (!canReviewRecord(user, record)) return fail('You cannot score this record.');

  const spec = RECORD_TYPES[record.recordType as RecordType];
  const full = await db.learningRecord.findUnique({
    where: { id: recordId },
    include: { entries: true },
  });
  if (!full) return fail('Record not found.');

  try {
    const result = await aiScoreRecord({
      recordTypeLabel: spec.label,
      title: full.title,
      description: full.description,
      entries: full.entries.map((e) => ({ title: e.title, content: e.content, rawScore: e.rawScore })),
      maxScore: spec.perEntryMax,
      rubric: spec.rubric,
      normalization: spec.normalization,
    });
    await db.learningRecord.update({
      where: { id: recordId },
      data: { aiScore: result.score, aiSummary: result.summary, aiModel: result.model },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'AI scoring failed.');
  }
  revalidatePath(`/records/${recordId}`);
  return ok();
}

const reviewSchema = z.object({
  recordId: z.string(),
  decision: z.enum(['APPROVED', 'REVISION', 'REJECTED']),
  facultyScore: z.coerce.number().min(0).optional(),
  mentorNote: z.string().optional(),
});

export async function reviewRecord(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse({
    recordId: formData.get('recordId'),
    decision: formData.get('decision'),
    facultyScore: formData.get('facultyScore') || undefined,
    mentorNote: formData.get('mentorNote') ?? undefined,
  });
  if (!parsed.success) return fail('Check the review form.');

  const record = await loadRecordForAccess(parsed.data.recordId);
  if (!record) return fail('Record not found.');
  if (!canReviewRecord(user, record)) return fail('You are not assigned to review this record.');

  const step = await currentSignoffStep(record.id);
  if (!step) return fail('No pending sign-off step.');
  if (!canActOnStep(user, step.role)) return fail('It is not your turn in the sign-off chain.');

  const spec = RECORD_TYPES[record.recordType as RecordType];
  const score =
    step.role === 'FACULTY'
      ? parsed.data.facultyScore
      : record.facultyScore ?? parsed.data.facultyScore;
  if (parsed.data.decision === 'APPROVED' && (score == null || Number.isNaN(score))) {
    return fail('A faculty score is required before approval.');
  }

  const { normalized, note } =
    score != null
      ? normalizeToWeight(record.recordType as RecordType, score, spec.perEntryMax, spec.weightPct)
      : { normalized: record.normalizedScore ?? 0, note: record.normalizationNote ?? '' };

  if (parsed.data.decision === 'REVISION' || parsed.data.decision === 'REJECTED') {
    await db.$transaction([
      db.learningRecord.update({
        where: { id: record.id },
        data: {
          status: parsed.data.decision,
          facultyScore: score ?? null,
          normalizedScore: null,
          normalizationNote: note || null,
          mentorNote: parsed.data.mentorNote || null,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      }),
      db.signoffStep.update({
        where: { id: step.id },
        data: {
          status: parsed.data.decision === 'REJECTED' ? 'REJECTED' : 'RETURNED',
          signerId: user.id,
          signedAt: new Date(),
        },
      }),
      db.notification.create({
        data: {
          userId: record.studentId,
          title: `Record ${parsed.data.decision.toLowerCase()}`,
          message: `"${record.title}" was returned.`,
          link: `/records/${record.id}`,
        },
      }),
    ]);
    const student = await db.user.findUnique({
      where: { id: record.studentId },
      select: { name: true, email: true },
    });
    const returned = recordDecisionEmail({
      studentName: student?.name,
      title: record.title,
      decision: parsed.data.decision,
      noteText: parsed.data.mentorNote,
      dashboardUrl: `${getSiteUrl()}/records/${record.id}`,
    });
    await sendMailSafe({ to: student?.email, ...returned });
  } else {
    const remaining = await db.signoffStep.count({
      where: {
        target: 'LEARNING_RECORD',
        targetId: record.id,
        status: 'PENDING',
        id: { not: step.id },
      },
    });
    const final = remaining === 0;
    await db.$transaction([
      db.learningRecord.update({
        where: { id: record.id },
        data: {
          status: final ? 'APPROVED' : 'UNDER_REVIEW',
          facultyScore: score ?? null,
          normalizedScore: final ? normalized : record.normalizedScore,
          normalizationNote: note || null,
          subjectWeightPct: spec.weightPct,
          perEntryMax: spec.perEntryMax,
          mentorNote: parsed.data.mentorNote || null,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      }),
      db.signoffStep.update({
        where: { id: step.id },
        data: { status: 'SIGNED', signerId: user.id, signedAt: new Date() },
      }),
      db.notification.create({
        data: {
          userId: record.studentId,
          title: final ? 'Record approved' : 'Record advanced',
          message: final
            ? `"${record.title}" was fully signed off.`
            : `"${record.title}" moved to the next reviewer.`,
          link: `/records/${record.id}`,
        },
      }),
    ]);

    const student = await db.user.findUnique({
      where: { id: record.studentId },
      select: { name: true, email: true },
    });
    const decisionMail = recordDecisionEmail({
      studentName: student?.name,
      title: record.title,
      decision: final ? 'APPROVED' : 'UNDER_REVIEW',
      noteText: parsed.data.mentorNote,
      dashboardUrl: `${getSiteUrl()}/records/${record.id}`,
    });
    await sendMailSafe({ to: student?.email, ...decisionMail });

    if (!final && record.student && record.course) {
      const nextStep = await currentSignoffStep(record.id);
      if (nextStep) {
        const next = await findActorForStep(
          { course: record.course, student: record.student },
          nextStep.role
        );
        if (next) {
          await db.notification.create({
            data: {
              userId: next.id,
              title: 'Record waiting on your sign-off',
              message: `"${record.title}" is at the ${nextStep.role.toLowerCase()} step.`,
              link: `/records/${record.id}`,
            },
          });
          const nextMail = recordSubmittedEmail({
            reviewerName: next.name,
            studentName: record.student.name ?? 'A student',
            title: record.title,
            courseLabel: nextStep.role,
            dashboardUrl: `${getSiteUrl()}/records/${record.id}`,
          });
          await sendMailSafe({ to: next.email, ...nextMail });
        }
      }
    }
  }

  revalidatePath(`/records/${record.id}`);
  revalidatePath('/review');
  return ok();
}

export async function fileAppeal(formData: FormData): Promise<void> {
  const user = await requireUser();
  const recordId = String(formData.get('recordId'));
  const reason = String(formData.get('reason') ?? '').trim();
  if (!reason) return fail('Explain why you are appealing.');
  const record = await db.learningRecord.findUnique({
    where: { id: recordId },
    include: { course: true, student: { select: { name: true } } },
  });
  if (!record || record.studentId !== user.id) return fail('Record not found.');

  const open = await db.scoreAppeal.findFirst({ where: { recordId, status: 'OPEN' } });
  if (open) return fail('An appeal is already open on this record.');

  await db.scoreAppeal.create({
    data: { recordId, studentId: user.id, reason },
  });
  const faculty = await db.user.findUnique({
    where: { id: record.course.facultyId },
    select: { id: true, name: true, email: true },
  });
  if (faculty) {
    await db.notification.create({
      data: {
        userId: faculty.id,
        title: 'Score appeal filed',
        message: `${record.student.name} appealed the score on "${record.title}".`,
        link: `/records/${recordId}`,
      },
    });
    const mail = appealFiledEmail({
      reviewerName: faculty.name,
      studentName: record.student.name,
      title: record.title,
      reason,
      dashboardUrl: `${getSiteUrl()}/records/${recordId}`,
    });
    await sendMailSafe({ to: faculty.email, ...mail });
  }
  revalidatePath(`/records/${recordId}`);
  revalidatePath('/review');
  return ok();
}

export async function resolveAppeal(formData: FormData): Promise<void> {
  const user = await requireUser();
  const appealId = String(formData.get('appealId'));
  const decision = String(formData.get('decision'));
  const newScoreRaw = formData.get('newScore');
  const note = String(formData.get('facultyOverrideReason') ?? '');

  if (!['UPHELD', 'DENIED'].includes(decision)) return fail('Choose uphold or deny.');

  const appeal = await db.scoreAppeal.findUnique({
    where: { id: appealId },
    include: { record: { include: { student: true, course: true } } },
  });
  if (!appeal || appeal.status !== 'OPEN') return fail('Appeal not found.');
  if (!canReviewRecord(user, appeal.record)) return fail('You cannot resolve this appeal.');

  const spec = RECORD_TYPES[appeal.record.recordType as RecordType];
  let normalized: number | null = appeal.record.normalizedScore;
  let facultyScore = appeal.record.facultyScore;
  let noteOut = appeal.record.normalizationNote;

  if (decision === 'UPHELD' && newScoreRaw != null && String(newScoreRaw) !== '') {
    const newScore = Number(newScoreRaw);
    if (Number.isNaN(newScore)) return fail('Enter a valid score.');
    const result = normalizeToWeight(appeal.record.recordType as RecordType, newScore, spec.perEntryMax, spec.weightPct);
    facultyScore = newScore;
    normalized = result.normalized;
    noteOut = result.note;
  }

  await db.$transaction([
    db.scoreAppeal.update({
      where: { id: appealId },
      data: {
        status: decision as 'UPHELD' | 'DENIED',
        facultyOverrideReason: note || null,
        newScore: facultyScore,
        resolvedById: user.id,
        resolvedAt: new Date(),
      },
    }),
    db.learningRecord.update({
      where: { id: appeal.recordId },
      data: {
        facultyScore,
        normalizedScore: normalized,
        normalizationNote: noteOut,
      },
    }),
    db.notification.create({
      data: {
        userId: appeal.studentId,
        title: decision === 'UPHELD' ? 'Appeal upheld' : 'Appeal denied',
        message: `Your appeal on "${appeal.record.title}" was ${decision.toLowerCase()}.`,
        link: `/records/${appeal.recordId}`,
      },
    }),
  ]);

  const student = await db.user.findUnique({
    where: { id: appeal.studentId },
    select: { name: true, email: true },
  });
  const mail = appealResolvedEmail({
    studentName: student?.name,
    title: appeal.record.title,
    decision,
    dashboardUrl: `${getSiteUrl()}/records/${appeal.recordId}`,
  });
  await sendMailSafe({ to: student?.email, ...mail });

  revalidatePath(`/records/${appeal.recordId}`);
  revalidatePath('/review');
  return ok();
}
