import { db } from './db';
import { RECORD_TYPES, COMBINATIONS, requiredRecordTypes, type RecordType } from './domain';
import { recordOrgWhere, studentOrgWhere } from './access';
import type { CurrentUser } from './session';

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
  subjectTotal: number;
  subjectMax: number;
}

export async function getStudentTrace(studentId: string): Promise<CourseTraceRow[]> {
  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    include: { course: true },
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

export async function getReviewQueue(user: CurrentUser) {
  const include = {
    student: { select: { name: true, registrationNumber: true, mentorId: true, departmentId: true, campusId: true } },
    course: true,
    appeals: { where: { status: 'OPEN' }, select: { id: true } },
  } as const;

  if (user.role === 'FACULTY') {
    return db.learningRecord.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] }, course: { facultyId: user.id } },
      include,
      orderBy: { submittedAt: 'asc' },
      take: 100,
    });
  }
  if (user.role === 'MENTOR') {
    return db.learningRecord.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] }, student: { mentorId: user.id } },
      include,
      orderBy: { submittedAt: 'asc' },
      take: 100,
    });
  }
  return db.learningRecord.findMany({
    where: {
      status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
      ...recordOrgWhere(user),
    },
    include,
    orderBy: { submittedAt: 'asc' },
    take: 100,
  });
}

export async function getAnalyticsOverview(user: CurrentUser) {
  const recordWhere = recordOrgWhere(user);
  const studentWhere = studentOrgWhere(user);
  const [students, faculty, records, byStatus, byType, byCampus] = await Promise.all([
    db.user.count({ where: studentWhere }),
    db.user.count({
      where:
        user.role === 'ADMIN'
          ? { role: 'FACULTY' }
          : user.role === 'HOD' && user.departmentId
            ? { role: 'FACULTY', departmentId: user.departmentId }
            : user.role === 'DEAN' && user.campusId
              ? { role: 'FACULTY', campusId: user.campusId }
              : { id: '__none__' },
    }),
    db.learningRecord.count({ where: recordWhere }),
    db.learningRecord.groupBy({ by: ['status'], where: recordWhere, _count: true }),
    db.learningRecord.groupBy({ by: ['recordType'], where: recordWhere, _count: true }),
    db.course.groupBy({
      by: ['campusId'],
      where:
        user.role === 'ADMIN'
          ? {}
          : user.role === 'HOD' && user.departmentId
            ? { departmentId: user.departmentId }
            : user.role === 'DEAN' && user.campusId
              ? { campusId: user.campusId }
              : { id: '__none__' },
      _count: true,
    }),
  ]);
  return { students, faculty, records, byStatus, byType, byCampus };
}

export async function getNotifications(userId: string) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}
