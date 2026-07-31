'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { RECORD_TYPES, normalizeToWeight, type RecordType } from '@/lib/domain';
import { aiScoreRecord, aiEnabled } from '@/lib/ai';

const createSchema = z.object({
  courseId: z.string().min(1),
  recordType: z.string().min(1),
  title: z.string().min(2),
  description: z.string().default(''),
  booksReferred: z.string().optional(),
});

// Create a record for a specific required (course, recordType) pair.
export async function createRecord(formData: FormData) {
  const user = await requireUser();
  if (user.role !== 'STUDENT') throw new Error('Only students file records');

  const parsed = createSchema.parse({
    courseId: formData.get('courseId'),
    recordType: formData.get('recordType'),
    title: formData.get('title'),
    description: formData.get('description') ?? '',
    booksReferred: formData.get('booksReferred') ?? undefined,
  });

  const course = await db.course.findUnique({ where: { id: parsed.courseId } });
  if (!course) throw new Error('Course not found');

  // Guard: one record per (student, course, recordType).
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
}

// Add an entry (experiment / task / session) with a rubric score.
export async function addEntry(formData: FormData) {
  const user = await requireUser();
  const recordId = String(formData.get('recordId'));
  const record = await db.learningRecord.findUnique({ where: { id: recordId } });
  if (!record || record.studentId !== user.id) throw new Error('Not found');
  if (record.status === 'APPROVED') throw new Error('Record already approved');

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
}

// Submit a record for review (creates the sign-off chain).
export async function submitRecord(formData: FormData) {
  const user = await requireUser();
  const recordId = String(formData.get('recordId'));
  const record = await db.learningRecord.findUnique({
    where: { id: recordId },
    include: { course: true, student: true },
  });
  if (!record || record.studentId !== user.id) throw new Error('Not found');

  await db.learningRecord.update({
    where: { id: recordId },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });

  // Sequential sign-off chain: Faculty → Mentor → HoD (generalized, finding h).
  const existingSteps = await db.signoffStep.count({
    where: { target: 'LEARNING_RECORD', targetId: recordId },
  });
  if (existingSteps === 0) {
    await db.signoffStep.createMany({
      data: [
        { target: 'LEARNING_RECORD', targetId: recordId, stepOrder: 1, role: 'FACULTY' },
        { target: 'LEARNING_RECORD', targetId: recordId, stepOrder: 2, role: 'MENTOR' },
        { target: 'LEARNING_RECORD', targetId: recordId, stepOrder: 3, role: 'HOD' },
      ],
    });
  }

  // Notify the course faculty.
  await db.notification.create({
    data: {
      userId: record.course.facultyId,
      title: 'Record submitted for review',
      message: `${record.student.name} submitted "${record.title}".`,
      link: `/records/${recordId}`,
    },
  });

  revalidatePath(`/records/${recordId}`);
  revalidatePath('/records');
}

// Optional AI advisory score (faculty triggers; always overridable — finding r).
export async function requestAiScore(formData: FormData) {
  await requireUser();
  const recordId = String(formData.get('recordId'));
  if (!aiEnabled) return;

  const record = await db.learningRecord.findUnique({
    where: { id: recordId },
    include: { entries: true },
  });
  if (!record) return;
  const spec = RECORD_TYPES[record.recordType as RecordType];

  const result = await aiScoreRecord({
    recordTypeLabel: spec.label,
    title: record.title,
    description: record.description,
    entries: record.entries.map((e) => ({ title: e.title, content: e.content })),
    maxScore: spec.perEntryMax,
  });
  if (result) {
    await db.learningRecord.update({
      where: { id: recordId },
      data: { aiScore: result.score, aiSummary: result.summary, aiModel: 'configured-provider' },
    });
    revalidatePath(`/records/${recordId}`);
  }
}

// Faculty review: set the final score, normalize to subject weight, decide status.
const reviewSchema = z.object({
  recordId: z.string(),
  decision: z.enum(['APPROVED', 'REVISION', 'REJECTED']),
  facultyScore: z.coerce.number().min(0),
  mentorNote: z.string().optional(),
});

export async function reviewRecord(formData: FormData) {
  const user = await requireUser();
  if (!['FACULTY', 'MENTOR', 'HOD', 'DEAN'].includes(user.role)) throw new Error('Forbidden');

  const parsed = reviewSchema.parse({
    recordId: formData.get('recordId'),
    decision: formData.get('decision'),
    facultyScore: formData.get('facultyScore'),
    mentorNote: formData.get('mentorNote') ?? undefined,
  });

  const record = await db.learningRecord.findUnique({ where: { id: parsed.recordId } });
  if (!record) throw new Error('Not found');
  const spec = RECORD_TYPES[record.recordType as RecordType];

  // Normalize the human score into the subject-level weight (findings e).
  const { normalized, note } = normalizeToWeight(
    record.recordType as RecordType,
    parsed.facultyScore,
    spec.perEntryMax,
    spec.weightPct
  );

  await db.learningRecord.update({
    where: { id: parsed.recordId },
    data: {
      status: parsed.decision,
      facultyScore: parsed.facultyScore,
      normalizedScore: parsed.decision === 'APPROVED' ? normalized : null,
      normalizationNote: note,
      subjectWeightPct: spec.weightPct,
      perEntryMax: spec.perEntryMax,
      mentorNote: parsed.mentorNote || null,
      reviewedById: user.id,
      reviewedAt: new Date(),
    },
  });

  // Advance the sign-off chain: mark this role's step signed.
  await db.signoffStep.updateMany({
    where: { target: 'LEARNING_RECORD', targetId: parsed.recordId, role: user.role as never, status: 'PENDING' },
    data: { status: 'SIGNED', signerId: user.id, signedAt: new Date() },
  });

  await db.notification.create({
    data: {
      userId: record.studentId,
      title: `Record ${parsed.decision.toLowerCase()}`,
      message: `"${record.title}" was reviewed.`,
      link: `/records/${parsed.recordId}`,
    },
  });

  revalidatePath(`/records/${parsed.recordId}`);
  revalidatePath('/review');
}

// Student appeals an AI/faculty score — logged, human-resolvable (finding r).
export async function fileAppeal(formData: FormData) {
  const user = await requireUser();
  const recordId = String(formData.get('recordId'));
  const reason = String(formData.get('reason') ?? '');
  const record = await db.learningRecord.findUnique({ where: { id: recordId } });
  if (!record || record.studentId !== user.id) throw new Error('Not found');

  await db.scoreAppeal.create({
    data: { recordId, studentId: user.id, reason },
  });
  await db.notification.create({
    data: {
      userId: record.reviewedById ?? user.id,
      title: 'Score appeal filed',
      message: `A student appealed the score on "${record.title}".`,
      link: `/records/${recordId}`,
    },
  });
  revalidatePath(`/records/${recordId}`);
}
