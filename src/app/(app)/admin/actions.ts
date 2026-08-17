'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { generateTempPassword, hashPassword } from '@/lib/auth';
import { fail, ok } from '@/lib/action-result';
import { credentialsEmail, sendMailSafe } from '@/lib/mailer';
import { getSiteUrl } from '@/lib/site';

async function admin() {
  return requireRole('ADMIN');
}

export async function createCampus(formData: FormData): Promise<void> {
  await admin();
  const name = String(formData.get('name') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  if (!name || !code) return fail('Name and code required.');
  const clash = await db.campus.findFirst({ where: { OR: [{ name }, { code }] } });
  if (clash) return fail('A campus with that name or code already exists.');
  await db.campus.create({ data: { name, code } });
  revalidatePath('/admin');
  return ok();
}

export async function createDepartment(formData: FormData): Promise<void> {
  await admin();
  const name = String(formData.get('name') ?? '').trim();
  const campusId = String(formData.get('campusId') ?? '');
  if (!name || !campusId) return fail('Name and campus required.');
  const clash = await db.department.findFirst({ where: { campusId, name } });
  if (clash) return fail('That department already exists on this campus.');
  await db.department.create({ data: { name, campusId } });
  revalidatePath('/admin');
  return ok();
}

export async function createProgram(formData: FormData): Promise<void> {
  await admin();
  const name = String(formData.get('name') ?? '').trim();
  const degree = String(formData.get('degree') ?? 'UG');
  const durationYears = Number(formData.get('durationYears') ?? 4) || 4;
  const departmentId = String(formData.get('departmentId') ?? '');
  if (!name || !departmentId) return fail('Name and department required.');
  await db.program.create({ data: { name, degree, durationYears, departmentId } });
  revalidatePath('/admin');
  return ok();
}

const courseSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(2),
  combinationCode: z.string().min(1),
  academicYear: z.string().min(1),
  term: z.string().min(1),
  credits: z.coerce.number().min(0).default(0),
  campusId: z.string().min(1),
  departmentId: z.string().min(1),
  programId: z.string().min(1),
  facultyId: z.string().min(1),
});

export async function createCourse(formData: FormData): Promise<void> {
  await admin();
  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Check the course form — every field is required.');
  const clash = await db.course.findFirst({
    where: {
      code: parsed.data.code,
      academicYear: parsed.data.academicYear,
      term: parsed.data.term,
      programId: parsed.data.programId,
    },
  });
  if (clash) return fail('That course code already exists for this program, year, and term.');
  await db.course.create({ data: parsed.data as never });
  revalidatePath('/admin');
  revalidatePath('/courses');
  return ok();
}

export async function updateUserRole(formData: FormData): Promise<void> {
  await admin();
  const userId = String(formData.get('userId'));
  const role = String(formData.get('role'));
  const campusId = String(formData.get('campusId') ?? '') || null;
  const departmentId = String(formData.get('departmentId') ?? '') || null;
  const programId = String(formData.get('programId') ?? '') || null;
  await db.user.update({
    where: { id: userId },
    data: { role: role as never, campusId, departmentId, programId: role === 'STUDENT' ? programId : null },
  });
  revalidatePath('/admin');
  return ok();
}

export async function assignMentor(formData: FormData): Promise<void> {
  await admin();
  const studentId = String(formData.get('studentId'));
  const mentorId = String(formData.get('mentorId') ?? '') || null;
  await db.user.update({ where: { id: studentId }, data: { mentorId } });
  revalidatePath('/admin');
  return ok();
}

export async function setUserActive(formData: FormData): Promise<void> {
  await admin();
  const userId = String(formData.get('userId'));
  const active = String(formData.get('active')) === 'true';
  await db.user.update({ where: { id: userId }, data: { isActive: active } });
  revalidatePath('/admin');
  return ok();
}

export async function createUser(formData: FormData): Promise<void> {
  await admin();
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? 'STUDENT');
  const registrationNumber = String(formData.get('registrationNumber') ?? '') || null;
  const campusId = String(formData.get('campusId') ?? '') || null;
  const departmentId = String(formData.get('departmentId') ?? '') || null;
  const programId = String(formData.get('programId') ?? '') || null;
  const mentorId = String(formData.get('mentorId') ?? '') || null;
  const typed = String(formData.get('password') ?? '').trim();
  const password = typed || generateTempPassword();
  if (!name || !email) return fail('Name and email required.');
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return fail('Email already exists.');
  if (registrationNumber) {
    const taken = await db.user.findUnique({ where: { registrationNumber } });
    if (taken) return fail('That registration number is already in use.');
  }
  await db.user.create({
    data: {
      name,
      email,
      role: role as never,
      registrationNumber: role === 'STUDENT' ? registrationNumber : null,
      campusId,
      departmentId,
      programId: role === 'STUDENT' ? programId : null,
      mentorId: role === 'STUDENT' ? mentorId : null,
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
    },
  });
  const mail = credentialsEmail({
    name,
    email,
    tempPassword: password,
    role,
    loginUrl: `${getSiteUrl()}/login`,
  });
  await sendMailSafe({ to: email, ...mail });
  revalidatePath('/admin');
  return ok();
}

export async function enrollStudent(formData: FormData): Promise<void> {
  await admin();
  const studentId = String(formData.get('studentId'));
  const courseId = String(formData.get('courseId'));
  if (!studentId || !courseId) return fail('Choose a student and a course.');
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return fail('Course not found.');
  const already = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (already) return fail('That student is already enrolled in this course.');
  await db.enrollment.create({
    data: { studentId, courseId, academicYear: course.academicYear },
  });
  revalidatePath('/admin');
  revalidatePath('/courses');
  revalidatePath('/dashboard');
  return ok();
}

export async function unenrollStudent(formData: FormData): Promise<void> {
  await admin();
  const enrollmentId = String(formData.get('enrollmentId') ?? '');
  if (!enrollmentId) return fail('Enrollment not found.');
  await db.enrollment.delete({ where: { id: enrollmentId } });
  revalidatePath('/admin');
  revalidatePath('/courses');
  revalidatePath('/dashboard');
  return ok();
}

export async function resendCredentials(formData: FormData): Promise<void> {
  await admin();
  const userId = String(formData.get('userId') ?? '');
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return fail('Person not found.');
  const password = generateTempPassword();
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password), mustChangePassword: true },
  });
  const mail = credentialsEmail({
    name: user.name,
    email: user.email,
    tempPassword: password,
    role: user.role,
    loginUrl: `${getSiteUrl()}/login`,
  });
  await sendMailSafe({ to: user.email, ...mail });
  revalidatePath('/admin');
  return ok();
}
