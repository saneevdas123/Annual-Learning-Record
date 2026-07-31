import { db } from './db';
import { RECORD_TYPES, requiredRecordTypes, type RecordType } from './domain';

// ---------------------------------------------------------------------------
// Student learning trace: for each enrolled course, which record types are
// required (from the combination code), which the student has filed, and the
// normalized subject-weight score achieved. This is the core "trace learning".
// ---------------------------------------------------------------------------

export interface CourseTraceRow {
  courseId: string;
  code: string;
  title: string;
  combinationLabel: string;
  academicYear: string;
  required: {
    type: RecordType;
    label: string;
    weightPct: number;
    recordId: string | null;
    status: string | null;
    normalizedScore: number | null;
  }[];
  subjectTotal: number; // sum of achieved normalized scores
  subjectMax: number; // sum of required weights
}

export async function getStudentTrace(studentId: string): Promise<CourseTraceRow[]> {
  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    include: {
      course: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const courseIds = enrollments.map((e) => e.course.id);
  const records = await db.learningRecord.findMany({
    where: { studentId, courseId: { in: courseIds.length ? courseIds : ['__none__'] } },
    select: {
      id: true,
      courseId: true,
      recordType: true,
      status: true,
      normalizedScore: true,
    },
  });

  const byCourseType = new Map<string, (typeof records)[number]>();
  for (const r of records) byCourseType.set(`${r.courseId}:${r.recordType}`, r);

  return enrollments.map((e) => {
    const { COMBINATIONS } = require('./domain') as typeof import('./domain');
    const combo = COMBINATIONS[e.course.combinationCode as keyof typeof COMBINATIONS];
    const required = requiredRecordTypes(e.course.combinationCode as never).map((type) => {
      const spec = RECORD_TYPES[type];
      const rec = byCourseType.get(`${e.course.id}:${type}`);
      return {
        type,
        label: spec.label,
        weightPct: spec.weightPct,
        recordId: rec?.id ?? null,
        status: rec?.status ?? null,
        normalizedScore: rec?.normalizedScore ?? null,
      };
    });
    const subjectTotal = required.reduce((s, r) => s + (r.normalizedScore ?? 0), 0);
    const subjectMax = required.reduce((s, r) => s + r.weightPct, 0);
    return {
      courseId: e.course.id,
      code: e.course.code,
      title: e.course.title,
      combinationLabel: combo?.label ?? e.course.combinationCode,
      academicYear: e.course.academicYear,
      required,
      subjectTotal: Number(subjectTotal.toFixed(2)),
      subjectMax,
    };
  });
}

export async function getStudentSummary(studentId: string) {
  const [records, credits, enrollments] = await Promise.all([
    db.learningRecord.groupBy({
      by: ['status'],
      where: { studentId },
      _count: true,
    }),
    db.creditLedgerEntry.aggregate({
      where: { studentId },
      _sum: { credits: true },
    }),
    db.enrollment.count({ where: { studentId } }),
  ]);
  const statusCounts: Record<string, number> = {};
  for (const r of records) statusCounts[r.status] = r._count;
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  return {
    totalRecords: total,
    approved: statusCounts.APPROVED ?? 0,
    pending: (statusCounts.SUBMITTED ?? 0) + (statusCounts.UNDER_REVIEW ?? 0),
    credits: credits._sum.credits ?? 0,
    courses: enrollments,
  };
}

// Records awaiting a given reviewer (faculty of the course, or mentor of student).
export async function getReviewQueue(user: { id: string; role: string }) {
  if (user.role === 'FACULTY') {
    return db.learningRecord.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] }, course: { facultyId: user.id } },
      include: { student: { select: { name: true, registrationNumber: true } }, course: true },
      orderBy: { submittedAt: 'asc' },
      take: 100,
    });
  }
  if (user.role === 'MENTOR') {
    return db.learningRecord.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] }, student: { mentorId: user.id } },
      include: { student: { select: { name: true, registrationNumber: true } }, course: true },
      orderBy: { submittedAt: 'asc' },
      take: 100,
    });
  }
  // HoD/Dean see all submitted in their department/campus.
  return db.learningRecord.findMany({
    where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
    include: { student: { select: { name: true, registrationNumber: true } }, course: true },
    orderBy: { submittedAt: 'asc' },
    take: 100,
  });
}

export async function getAnalyticsOverview() {
  const [students, faculty, records, byStatus, byType, byCampus] = await Promise.all([
    db.user.count({ where: { role: 'STUDENT' } }),
    db.user.count({ where: { role: 'FACULTY' } }),
    db.learningRecord.count(),
    db.learningRecord.groupBy({ by: ['status'], _count: true }),
    db.learningRecord.groupBy({ by: ['recordType'], _count: true }),
    db.course.groupBy({ by: ['campusId'], _count: true }),
  ]);
  return { students, faculty, records, byStatus, byType, byCampus };
}
