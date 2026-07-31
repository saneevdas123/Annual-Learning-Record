import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { COMBINATIONS, ROLE_LABELS } from '@/lib/domain';
import { academicYearOptions } from '@/lib/utils';
import { PageHeader, Badge, EmptyState } from '@/components/ui';
import {
  createCampus,
  createDepartment,
  createProgram,
  createCourse,
  createUser,
  updateUserRole,
  assignMentor,
  setUserActive,
  enrollStudent,
} from './actions';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'organization', label: 'Organization' },
  { key: 'courses', label: 'Courses' },
  { key: 'people', label: 'People' },
  { key: 'enroll', label: 'Enrollment' },
];

export default async function AdminPage({ searchParams }: { searchParams: { tab?: string } }) {
  await requireRole('ADMIN');
  const tab = searchParams.tab && TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab : 'organization';

  const [campuses, departments, programs, faculty, users, courses, students, mentors] =
    await Promise.all([
      db.campus.findMany({ orderBy: { name: 'asc' } }),
      db.department.findMany({ include: { campus: { select: { name: true } } }, orderBy: { name: 'asc' } }),
      db.program.findMany({ include: { department: { select: { name: true } } }, orderBy: { name: 'asc' } }),
      db.user.findMany({ where: { role: 'FACULTY' }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
      db.course.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
      db.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, name: true, registrationNumber: true }, orderBy: { name: 'asc' } }),
      db.user.findMany({ where: { role: 'MENTOR' }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Platform setup"
        subtitle="Configure the institution, tag courses with their subject configuration, and manage people."
      />

      <nav className="flex flex-wrap gap-1 border-b border-indigo-100">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={
              'rounded-t-lg px-4 py-2 text-sm font-medium transition ' +
              (tab === t.key ? 'border-b-2 border-seal-500 text-ink' : 'text-ink-muted hover:text-ink')
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'organization' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <FormCard title="Add campus" action={createCampus}>
            <Field label="Campus name" name="name" placeholder="e.g. Paralakhemundi" required />
            <Field label="Code" name="code" placeholder="PKD" required />
            <Submit>Create campus</Submit>
          </FormCard>

          <FormCard title="Add department" action={createDepartment}>
            <Select label="Campus" name="campusId" options={campuses.map((c) => ({ value: c.id, label: c.name }))} required />
            <Field label="Department name" name="name" placeholder="e.g. Computer Science" required />
            <Submit>Create department</Submit>
          </FormCard>

          <FormCard title="Add program" action={createProgram}>
            <Select label="Department" name="departmentId" options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.campus.name})` }))} required />
            <Field label="Program name" name="name" placeholder="e.g. B.Tech CSE" required />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Degree" name="degree" options={[{ value: 'UG', label: 'UG' }, { value: 'PG', label: 'PG' }, { value: 'Diploma', label: 'Diploma' }]} />
              <Field label="Years" name="durationYears" type="number" defaultValue="4" />
            </div>
            <Submit>Create program</Submit>
          </FormCard>

          <div className="lg:col-span-3">
            <SummaryGrid campuses={campuses.length} departments={departments.length} programs={programs.length} />
          </div>
        </div>
      )}

      {tab === 'courses' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <FormCard title="Create course" action={createCourse}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code" name="code" placeholder="CS201" required />
                <Field label="Credits" name="credits" type="number" defaultValue="4" />
              </div>
              <Field label="Title" name="title" placeholder="Data Structures" required />
              <Select
                label="Subject configuration"
                name="combinationCode"
                options={Object.values(COMBINATIONS).map((c) => ({ value: c.code, label: c.label }))}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Academic year" name="academicYear" options={academicYearOptions().map((y) => ({ value: y, label: y }))} required />
                <Field label="Term" name="term" placeholder="Sem 3" required />
              </div>
              <Select label="Campus" name="campusId" options={campuses.map((c) => ({ value: c.id, label: c.name }))} required />
              <Select label="Department" name="departmentId" options={departments.map((d) => ({ value: d.id, label: d.name }))} required />
              <Select label="Program" name="programId" options={programs.map((p) => ({ value: p.id, label: p.name }))} required />
              <Select label="Faculty" name="facultyId" options={faculty.map((f) => ({ value: f.id, label: f.name }))} required />
              <Submit>Create course</Submit>
            </FormCard>
          </div>
          <div className="lg:col-span-3">
            <div className="card overflow-hidden">
              <div className="border-b border-indigo-100 px-5 py-3">
                <h3 className="font-display text-base text-ink">Courses ({courses.length})</h3>
              </div>
              {courses.length === 0 ? (
                <EmptyState title="No courses yet" message="Create your first course on the left." />
              ) : (
                <ul className="divide-y divide-indigo-100">
                  {courses.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="font-mono text-xs text-ink-muted">{c.code}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{c.title}</span>
                      <Badge tone="indigo">{COMBINATIONS[c.combinationCode as keyof typeof COMBINATIONS]?.label}</Badge>
                      <span className="hidden font-mono text-[11px] text-ink-muted sm:block">{c.academicYear}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'people' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <FormCard title="Add person" action={createUser}>
              <Field label="Full name" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Registration no. (students)" name="registrationNumber" />
              <Select label="Role" name="role" options={Object.entries(ROLE_LABELS).filter(([k]) => k !== 'INDUSTRY_SUPERVISOR').map(([k, v]) => ({ value: k, label: v }))} />
              <Field label="Temp password" name="password" placeholder="Cutm@12345" />
              <Submit>Create account</Submit>
            </FormCard>
          </div>
          <div className="lg:col-span-3 space-y-3">
            <div className="card overflow-hidden">
              <div className="border-b border-indigo-100 px-5 py-3">
                <h3 className="font-display text-base text-ink">People ({users.length})</h3>
              </div>
              <ul className="divide-y divide-indigo-100">
                {users.map((u) => (
                  <li key={u.id} className="space-y-2 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-ink">{u.name}</span>
                        <span className="ml-2 font-mono text-[11px] text-ink-muted">{u.email}</span>
                      </span>
                      <Badge tone={u.isActive ? 'indigo' : 'seal'}>{ROLE_LABELS[u.role]}</Badge>
                      <form action={setUserActive}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="active" value={(!u.isActive).toString()} />
                        <button className="btn-ghost px-2 py-1 text-[11px]">
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </form>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <form action={updateUserRole} className="flex items-end gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <select name="role" defaultValue={u.role} className="field w-auto py-1 text-xs">
                          {Object.entries(ROLE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <select name="campusId" defaultValue={u.campusId ?? ''} className="field w-auto py-1 text-xs">
                          <option value="">— campus —</option>
                          {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select name="departmentId" defaultValue={u.departmentId ?? ''} className="field w-auto py-1 text-xs">
                          <option value="">— dept —</option>
                          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button className="btn-outline px-2 py-1 text-[11px]">Save</button>
                      </form>
                      {u.role === 'STUDENT' && (
                        <form action={assignMentor} className="flex items-end gap-2">
                          <input type="hidden" name="studentId" value={u.id} />
                          <select name="mentorId" defaultValue={u.mentorId ?? ''} className="field w-auto py-1 text-xs">
                            <option value="">— mentor —</option>
                            {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                          <button className="btn-ghost px-2 py-1 text-[11px]">Assign</button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'enroll' && (
        <div className="max-w-xl">
          <FormCard title="Enroll a student in a course" action={enrollStudent}>
            <Select label="Student" name="studentId" options={students.map((s) => ({ value: s.id, label: `${s.name}${s.registrationNumber ? ` (${s.registrationNumber})` : ''}` }))} required />
            <Select label="Course" name="courseId" options={courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.title}` }))} required />
            <Submit>Enroll</Submit>
          </FormCard>
          <p className="mt-3 text-sm text-ink-muted">
            Enrolling a student makes the course&apos;s required learning records appear on their dashboard automatically.
          </p>
        </div>
      )}
    </div>
  );
}

/* --- small server-safe form primitives --- */

function FormCard({ title, action, children }: { title: string; action: (fd: FormData) => void; children: React.ReactNode }) {
  return (
    <form action={action} className="card space-y-3 p-5">
      <h3 className="font-display text-base text-ink">{title}</h3>
      {children}
    </form>
  );
}

function Field({ label, name, type = 'text', placeholder, required, defaultValue }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue} className="field" />
    </div>
  );
}

function Select({ label, name, options, required }: { label: string; name: string; options: { value: string; label: string }[]; required?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select name={name} required={required} defaultValue="" className="field">
        <option value="" disabled>Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Submit({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end pt-1">
      <button className="btn-primary">{children}</button>
    </div>
  );
}

function SummaryGrid({ campuses, departments, programs }: { campuses: number; departments: number; programs: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="card p-4"><p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">Campuses</p><p className="mt-1 font-mono text-2xl text-ink">{campuses}</p></div>
      <div className="card p-4"><p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">Departments</p><p className="mt-1 font-mono text-2xl text-ink">{departments}</p></div>
      <div className="card p-4"><p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">Programs</p><p className="mt-1 font-mono text-2xl text-ink">{programs}</p></div>
    </div>
  );
}
