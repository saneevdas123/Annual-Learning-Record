'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
import { fail, ok } from '@/lib/action-result';

async function admin() {
  return requireRole('ADMIN');
}

export async function createCampus(formData: FormData): Promise<void> {
  await admin();
  const name = String(formData.get('name') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  if (!name || !code) return fail('Name and code required.');
  await db.campus.create({ data: { name, code } });
  revalidatePath('/admin');
  return ok();
}

export async function createDepartment(formData: FormData): Promise<void> {
  await admin();
  const name = String(formData.get('name') ?? '').trim();
  const campusId = String(formData.get('campusId') ?? '');
  if (!name || !campusId) return fail('Name and campus required.');
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
  if (!parsed.success) return fail('Check the course form.');
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
  await db.user.update({
    where: { id: userId },
    data: { role: role as never, campusId, departmentId },
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
  const password = String(formData.get('password') ?? '') || 'Cutm@12345';
  if (!name || !email) return fail('Name and email required.');
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return fail('Email already exists.');
  await db.user.create({
    data: {
      name,
      email,
      role: role as never,
      registrationNumber,
      passwordHash: await hashPassword(password),
    },
  });
  revalidatePath('/admin');
  return ok();
}

export async function enrollStudent(formData: FormData): Promise<void> {
  await admin();
  const studentId = String(formData.get('studentId'));
  const courseId = String(formData.get('courseId'));
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return fail('Course not found.');
  await db.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    create: { studentId, courseId, academicYear: course.academicYear },
    update: {},
  });
  revalidatePath('/admin');
  return ok();
}
