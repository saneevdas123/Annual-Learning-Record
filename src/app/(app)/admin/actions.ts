'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { hashPassword } from '@/lib/auth';

async function admin() {
  return requireRole('ADMIN');
}

export async function createCampus(formData: FormData) {
  await admin();
  const name = String(formData.get('name') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  if (!name || !code) throw new Error('Name and code required');
  await db.campus.create({ data: { name, code } });
  revalidatePath('/admin');
}

export async function createDepartment(formData: FormData) {
  await admin();
  const name = String(formData.get('name') ?? '').trim();
  const campusId = String(formData.get('campusId') ?? '');
  if (!name || !campusId) throw new Error('Name and campus required');
  await db.department.create({ data: { name, campusId } });
  revalidatePath('/admin');
}

export async function createProgram(formData: FormData) {
  await admin();
  const name = String(formData.get('name') ?? '').trim();
  const degree = String(formData.get('degree') ?? 'UG');
  const durationYears = Number(formData.get('durationYears') ?? 4) || 4;
  const departmentId = String(formData.get('departmentId') ?? '');
  if (!name || !departmentId) throw new Error('Name and department required');
  await db.program.create({ data: { name, degree, durationYears, departmentId } });
  revalidatePath('/admin');
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

export async function createCourse(formData: FormData) {
  await admin();
  const p = courseSchema.parse(Object.fromEntries(formData));
  await db.course.create({ data: p as any });
  revalidatePath('/admin');
  revalidatePath('/courses');
}

export async function updateUserRole(formData: FormData) {
  await admin();
  const userId = String(formData.get('userId'));
  const role = String(formData.get('role'));
  const campusId = String(formData.get('campusId') ?? '') || null;
  const departmentId = String(formData.get('departmentId') ?? '') || null;
  await db.user.update({
    where: { id: userId },
    data: { role: role as any, campusId, departmentId },
  });
  revalidatePath('/admin');
}

export async function assignMentor(formData: FormData) {
  await admin();
  const studentId = String(formData.get('studentId'));
  const mentorId = String(formData.get('mentorId') ?? '') || null;
  await db.user.update({ where: { id: studentId }, data: { mentorId } });
  revalidatePath('/admin');
}

export async function setUserActive(formData: FormData) {
  await admin();
  const userId = String(formData.get('userId'));
  const active = String(formData.get('active')) === 'true';
  await db.user.update({ where: { id: userId }, data: { isActive: active } });
  revalidatePath('/admin');
}

export async function createUser(formData: FormData) {
  await admin();
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? 'STUDENT');
  const registrationNumber = String(formData.get('registrationNumber') ?? '') || null;
  const password = String(formData.get('password') ?? '') || 'Cutm@12345';
  if (!name || !email) throw new Error('Name and email required');
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) throw new Error('Email already exists');
  await db.user.create({
    data: {
      name,
      email,
      role: role as any,
      registrationNumber,
      passwordHash: await hashPassword(password),
    },
  });
  revalidatePath('/admin');
}

export async function enrollStudent(formData: FormData) {
  await admin();
  const studentId = String(formData.get('studentId'));
  const courseId = String(formData.get('courseId'));
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');
  await db.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    create: { studentId, courseId, academicYear: course.academicYear },
    update: {},
  });
  revalidatePath('/admin');
}
