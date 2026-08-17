import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { COMBINATIONS } from '@/lib/domain';
import { PageHead, Badge, EmptyState, Stat } from '@/components/ui';
import { ActionForm } from '@/components/ActionForm';
import { Prisma } from '@prisma/client';
import { unenrollStudent } from './actions';
import { AdminSearch } from './AdminForms';
import { CourseCreateForm } from './CourseCreateForm';
import { PersonCreateForm } from './PersonCreateForm';
import { PersonEditor } from './PersonEditor';
import { EnrollCreateForm } from './EnrollCreateForm';
import { OrgWorkspace } from './OrgWorkspace';
import { AppTabs } from '@/components/AppTabs';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMeta({
  title: 'Administration',
  description: 'Set up campuses, departments, programs, people, courses, and enrollment.',
  path: '/admin',
});

const TABS = [
  { key: 'organization', label: 'Organization' },
  { key: 'courses', label: 'Courses' },
  { key: 'people', label: 'People' },
  { key: 'enroll', label: 'Enrollment' },
] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; role?: string }>;
}) {
  await requireRole('ADMIN');
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as (typeof TABS)[number]['key']) : 'organization';
  const q = (sp.q ?? '').trim();
  const roleFilter = (sp.role ?? '').trim();

  const userWhere: Prisma.UserWhereInput = {
    ...(roleFilter ? { role: roleFilter as never } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { registrationNumber: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const courseWhere: Prisma.CourseWhereInput = q
    ? {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const [campuses, departments, programs, faculty, courseCount, userCount, enrollmentCount] = await Promise.all([
    db.campus.findMany({ orderBy: { name: 'asc' } }),
    db.department.findMany({ include: { campus: { select: { name: true } } }, orderBy: { name: 'asc' } }),
    db.program.findMany({
      include: { department: { include: { campus: { select: { name: true } } } } },
      orderBy: { name: 'asc' },
    }),
    db.user.findMany({
      where: { role: 'FACULTY', isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.course.count(),
    db.user.count(),
    db.enrollment.count(),
  ]);

  const [users, mentors, courses, students, enrollments] = await Promise.all([
    db.user.findMany({
      where: userWhere,
      include: { campus: { select: { name: true } }, department: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 120,
    }),
    db.user.findMany({
      where: { role: 'MENTOR', isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.course.findMany({
      where: courseWhere,
      include: {
        faculty: { select: { name: true } },
        campus: { select: { name: true } },
        department: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    db.user.findMany({
      where: { role: 'STUDENT', isActive: true },
      select: { id: true, name: true, registrationNumber: true },
      orderBy: { name: 'asc' },
    }),
    db.enrollment.findMany({
      include: {
        student: { select: { name: true, registrationNumber: true } },
        course: { select: { code: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 80,
    }),
  ]);

  const counts = {
    organization: campuses.length + departments.length + programs.length,
    courses: courseCount,
    people: userCount,
    enroll: enrollmentCount,
  };

  const setup = [
    { done: campuses.length > 0, label: 'Campus', hint: 'Where the school sits' },
    { done: departments.length > 0, label: 'Department', hint: 'Needs a campus' },
    { done: programs.length > 0, label: 'Program', hint: 'Needs a department' },
    { done: faculty.length > 0, label: 'Faculty', hint: 'People tab' },
    { done: courseCount > 0, label: 'Course', hint: 'Then enroll students' },
  ];

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="Administration"
        title="Platform setup"
        subtitle="Build the tree in order: campus → department → program → people → courses → enrollment."
      />

      <AppTabs
        active={tab}
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          href: `/admin?tab=${t.key}`,
          count: counts[t.key],
        }))}
        panels={{
          organization: (
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-bold text-ink">Setup checklist</h2>
            <p className="mt-1 text-sm text-ink/55">Do these in order. Later tabs stay empty until the earlier ones exist.</p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-5">
              {setup.map((s, i) => (
                <li
                  key={s.label}
                  className={`rounded-neo border-2 px-3 py-2.5 ${s.done ? 'border-ink/10 bg-accent-mint/50' : 'border-ink bg-white'}`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink/40">Step {i + 1}</p>
                  <p className="font-bold text-ink">{s.done ? '✓ ' : ''}{s.label}</p>
                  <p className="text-[11px] text-ink/50">{s.hint}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat tone="gray" label="Campuses" value={campuses.length} />
            <Stat tone="brand" label="Departments" value={departments.length} />
            <Stat tone="amber" label="Programs" value={programs.length} />
          </div>

          <OrgWorkspace campuses={campuses} departments={departments} programs={programs} />
        </div>
          ),
          courses: (
        <div className="space-y-4">
          <AdminSearch tab="courses" q={q} placeholder="Search code or title" />
          <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
                  <h3 className="font-bold text-ink">
                    Courses {q ? `(${courses.length} matches)` : `(${courseCount})`}
                  </h3>
                  <CourseCreateForm
                    campuses={campuses}
                    departments={departments}
                    programs={programs.map((p) => ({ id: p.id, name: p.name, departmentId: p.departmentId }))}
                    faculty={faculty}
                  />
                </div>
                {courses.length === 0 ? (
                  <EmptyState
                    title={q ? 'No matching courses' : 'No courses yet'}
                    message={q ? 'Try another search.' : 'Create a course once faculty and a program exist.'}
                  />
                ) : (
                  <ul className="divide-y divide-ink/10">
                    {courses.map((c) => (
                      <li key={c.id}>
                        <Link href={`/courses/${c.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-ink/[0.03]">
                          <span className="text-xs font-bold text-ink/45">{c.code}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink">{c.title}</span>
                            <span className="text-[11px] text-ink/45">
                              {c.faculty.name} · {c.department.name} · {c._count.enrollments} enrolled
                            </span>
                          </span>
                          <Badge tone="blue">{COMBINATIONS[c.combinationCode as keyof typeof COMBINATIONS]?.label}</Badge>
                          <span className="hidden text-[11px] text-ink/45 sm:block">{c.academicYear}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
        </div>
          ),
          people: (
        <div className="space-y-4">
          <AdminSearch tab="people" q={q} role={roleFilter} placeholder="Search name, email, or registration no." />
          <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
                  <div>
                    <h3 className="font-bold text-ink">
                      People {q || roleFilter ? `(${users.length} shown)` : `(${userCount})`}
                    </h3>
                    <p className="text-xs text-ink/45">Open Edit to place someone, assign a mentor, or resend login.</p>
                  </div>
                  <PersonCreateForm
                    campuses={campuses}
                    departments={departments}
                    programs={programs.map((p) => ({ id: p.id, name: p.name, departmentId: p.departmentId }))}
                    mentors={mentors}
                  />
                </div>
                {users.length === 0 ? (
                  <EmptyState
                    title={q || roleFilter ? 'No matching people' : 'No people yet'}
                    message="Add a person, or ask students to self-register with a university email."
                  />
                ) : (
                  <ul className="divide-y divide-ink/10">
                    {users.map((u) => (
                      <PersonEditor
                        key={u.id}
                        person={u}
                        campuses={campuses}
                        departments={departments}
                        programs={programs.map((p) => ({ id: p.id, name: p.name, departmentId: p.departmentId }))}
                        mentors={mentors}
                      />
                    ))}
                  </ul>
                )}
              </div>
        </div>
          ),
          enroll: (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat tone="gray" label="Active students" value={students.length} />
            <Stat tone="brand" label="Courses" value={courseCount} />
            <Stat tone="green" label="Enrollments" value={enrollmentCount} />
          </div>
          <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
                  <h3 className="font-bold text-ink">Recent enrollments ({enrollmentCount})</h3>
                  <EnrollCreateForm students={students} courses={courses} />
                </div>
                {enrollments.length === 0 ? (
                  <EmptyState
                    title="Nobody enrolled yet"
                    message="Enroll a student so their required learning records appear."
                  />
                ) : (
                  <ul className="divide-y divide-ink/10">
                    {enrollments.map((e) => (
                      <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink">{e.student.name}</span>
                          <span className="text-[11px] text-ink/45">
                            {e.course.code} — {e.course.title}
                            {e.student.registrationNumber ? ` · ${e.student.registrationNumber}` : ''}
                          </span>
                        </span>
                        <ActionForm action={unenrollStudent} success="Removed from course.">
                          <input type="hidden" name="enrollmentId" value={e.id} />
                          <button className="btn-ghost !px-3 !py-1.5 text-xs">Remove</button>
                        </ActionForm>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
        </div>
          ),
        }}
      />
    </div>
  );
}
