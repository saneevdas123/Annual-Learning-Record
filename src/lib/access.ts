import { db } from './db';
import { requiredRecordTypes, type CombinationCode, type RecordType } from './domain';
import type { CurrentUser } from './session';
import type { Prisma } from '@prisma/client';

export async function assertStudentEnrolled(studentId: string, courseId: string) {
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!enrollment) {
    throw new Error('You are not enrolled in this course.');
  }
  return enrollment;
}

export function recordTypeAllowedForCourse(combinationCode: string, recordType: string) {
  return requiredRecordTypes(combinationCode as CombinationCode).includes(recordType as RecordType);
}

export function assertDeclaration(user: CurrentUser) {
  if (!user.eDeclarationAt) {
    throw new Error('Accept the academic integrity declaration on your profile before filing or submitting records.');
  }
}

type RecordForAccess = {
  studentId: string;
  courseId: string;
  student?: { mentorId: string | null; departmentId: string | null; campusId: string | null };
  course?: { facultyId: string; departmentId: string; campusId: string };
};

export async function loadRecordForAccess(recordId: string) {
  return db.learningRecord.findUnique({
    where: { id: recordId },
    include: {
      student: { select: { id: true, mentorId: true, departmentId: true, campusId: true } },
      course: { select: { id: true, facultyId: true, departmentId: true, campusId: true, combinationCode: true } },
    },
  });
}

export function canReviewRecord(user: CurrentUser, record: RecordForAccess): boolean {
  if (['FACULTY', 'MENTOR', 'HOD', 'DEAN'].includes(user.role) === false) return false;
  if (user.role === 'FACULTY') {
    return record.course?.facultyId === user.id;
  }
  if (user.role === 'MENTOR') {
    return record.student?.mentorId === user.id;
  }
  if (user.role === 'HOD') {
    if (!user.departmentId) return false;
    return (
      record.student?.departmentId === user.departmentId ||
      record.course?.departmentId === user.departmentId
    );
  }
  if (user.role === 'DEAN') {
    if (!user.campusId) return false;
    return record.student?.campusId === user.campusId || record.course?.campusId === user.campusId;
  }
  return false;
}

export async function currentSignoffStep(recordId: string) {
  const steps = await db.signoffStep.findMany({
    where: { target: 'LEARNING_RECORD', targetId: recordId },
    orderBy: { stepOrder: 'asc' },
  });
  return steps.find((s) => s.status === 'PENDING') ?? null;
}

export function canActOnStep(user: CurrentUser, stepRole: string) {
  if (user.role === stepRole) return true;
  if (user.role === 'DEAN' && stepRole === 'HOD') return true;
  return false;
}

export function recordOrgWhere(user: CurrentUser): Prisma.LearningRecordWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'HOD' && user.departmentId) {
    return {
      OR: [{ student: { departmentId: user.departmentId } }, { course: { departmentId: user.departmentId } }],
    };
  }
  if (user.role === 'DEAN' && user.campusId) {
    return {
      OR: [{ student: { campusId: user.campusId } }, { course: { campusId: user.campusId } }],
    };
  }
  return { id: '__none__' };
}

export function courseOrgWhere(user: CurrentUser): Prisma.CourseWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'HOD' && user.departmentId) return { departmentId: user.departmentId };
  if (user.role === 'DEAN' && user.campusId) return { campusId: user.campusId };
  if (user.role === 'FACULTY') return { facultyId: user.id };
  return { id: '__none__' };
}

export function studentOrgWhere(user: CurrentUser): Prisma.UserWhereInput {
  if (user.role === 'ADMIN') return { role: 'STUDENT' };
  if (user.role === 'HOD' && user.departmentId) return { role: 'STUDENT', departmentId: user.departmentId };
  if (user.role === 'DEAN' && user.campusId) return { role: 'STUDENT', campusId: user.campusId };
  return { id: '__none__' };
}
