import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { db } from '@/lib/db';
import { COMBINATIONS, requiredRecordTypes, RECORD_TYPES, type RecordType } from '@/lib/domain';
import { PageHead, Badge, SealDisc } from '@/components/ui';
import { AppTabs } from '@/components/AppTabs';
import { assertCanViewCourse } from '@/lib/access';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const course = await db.course.findUnique({
    where: { id },
    select: { code: true, title: true, academicYear: true },
  });
  if (!course) {
    return pageMeta({ title: 'Course', description: 'Course learning records.', path: `/courses/${id}` });
  }
  return pageMeta({
    title: `${course.code} · ${course.title}`,
    description: `${course.title} (${course.academicYear}) — required learning records on the CUTM ALR.`,
    path: `/courses/${id}`,
  });
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  if (!(await assertCanViewCourse(user, id))) notFound();

  const course = await db.course.findUnique({
    where: { id },
    include: {
      faculty: { select: { name: true } },
      campus: { select: { name: true } },
      department: { select: { name: true } },
      program: { select: { name: true } },
    },
  });
  if (!course) notFound();

  const combo = COMBINATIONS[course.combinationCode as keyof typeof COMBINATIONS];
  const reqs = requiredRecordTypes(course.combinationCode as never);
  const isStudent = user.role === 'STUDENT';
  const tab = !isStudent && rawTab === 'students' ? 'students' : 'records';

  const myRecords = isStudent
    ? await db.learningRecord.findMany({
        where: { courseId: course.id, studentId: user.id },
      })
    : [];
  const byType = new Map(myRecords.map((r) => [r.recordType, r]));

  const roster = !isStudent
    ? await db.enrollment.findMany({
        where: { courseId: course.id },
        include: { student: { select: { id: true, name: true, registrationNumber: true } } },
        take: 300,
      })
    : [];
  const courseRecords = !isStudent
    ? await db.learningRecord.findMany({ where: { courseId: course.id } })
    : [];

  return (
    <div className="space-y-6">
      <Link href="/courses" className="text-sm font-semibold text-ink/55 hover:text-ink">
        ← All courses
      </Link>
      <PageHead
        eyebrow={course.code}
        title={course.title}
        subtitle={`${course.program.name} · ${course.academicYear} · ${course.term}`}
        action={<Badge tone="blue">{combo?.label ?? course.combinationCode}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {!isStudent ? (
        <AppTabs
          active={tab}
          tabs={[
            { key: 'records', label: 'Required records', href: `/courses/${course.id}`, count: reqs.length },
            { key: 'students', label: 'Students', href: `/courses/${course.id}?tab=students`, count: roster.length },
          ]}
          panels={{
            records: (
          <section className="card p-5">
            <h2 className="text-lg font-bold text-ink">Required learning records</h2>
            <p className="mt-1 text-sm text-ink/55">
              This subject is configured as <strong>{combo?.label}</strong>, which requires {reqs.length} record{' '}
              {reqs.length === 1 ? 'type' : 'types'} totalling{' '}
              {reqs.reduce((s, t) => s + RECORD_TYPES[t].weightPct, 0)}% of the subject weight.
            </p>
            <div className="mt-4 space-y-3">
              {reqs.map((t) => {
                const s = RECORD_TYPES[t as RecordType];
                const mine = byType.get(t);
                return (
                  <div key={t} className="ui-nest p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-ink">{s.label}</h3>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                          weight {s.weightPct}% · scored /{s.perEntryMax} per entry
                        </p>
                      </div>
                      {isStudent &&
                        (mine ? (
                          <div className="flex items-center gap-2">
                            <SealDisc status={mine.status} />
                            <Link href={`/records/${mine.id}`} className="btn-ghost !px-3 !py-1.5 text-xs">
                              Open
                            </Link>
                          </div>
                        ) : (
                          <Link
                            href={`/records/new?courseId=${course.id}&type=${t}`}
                            className="btn-primary !px-3 !py-1.5 text-xs"
                          >
                            File record
                          </Link>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-ink/60">{s.normalization}</p>
                  </div>
                );
              })}
            </div>
          </section>
            ),
            students: (
            <section className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Enrolled students</h2>
                <span className="text-xs font-semibold text-ink/45">{roster.length}</span>
              </div>
              {roster.length === 0 ? (
                <p className="mt-2 text-sm text-ink/45">No students enrolled yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-ink/10">
                  {roster.map((e) => {
                    const recs = courseRecords.filter((r) => r.studentId === e.student.id);
                    return (
                      <li key={e.id} className="flex items-center justify-between py-2.5">
                        <span>
                          <span className="text-sm font-semibold text-ink">{e.student.name}</span>
                          <span className="ml-2 text-[11px] text-ink/45">{e.student.registrationNumber ?? ''}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-ink/45">
                          {recs.filter((r) => r.status === 'APPROVED').length}/{reqs.length} approved
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            ),
          }}
        />
          ) : (
          <section className="card p-5">
            <h2 className="text-lg font-bold text-ink">Required learning records</h2>
            <p className="mt-1 text-sm text-ink/55">
              This subject is configured as <strong>{combo?.label}</strong>, which requires {reqs.length} record{' '}
              {reqs.length === 1 ? 'type' : 'types'} totalling{' '}
              {reqs.reduce((s, t) => s + RECORD_TYPES[t].weightPct, 0)}% of the subject weight.
            </p>
            <div className="mt-4 space-y-3">
              {reqs.map((t) => {
                const s = RECORD_TYPES[t as RecordType];
                const mine = byType.get(t);
                return (
                  <div key={t} className="ui-nest p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-ink">{s.label}</h3>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                          weight {s.weightPct}% · scored /{s.perEntryMax} per entry
                        </p>
                      </div>
                      {mine ? (
                          <div className="flex items-center gap-2">
                            <SealDisc status={mine.status} />
                            <Link href={`/records/${mine.id}`} className="btn-ghost !px-3 !py-1.5 text-xs">
                              Open
                            </Link>
                          </div>
                        ) : (
                          <Link
                            href={`/records/new?courseId=${course.id}&type=${t}`}
                            className="btn-primary !px-3 !py-1.5 text-xs"
                          >
                            File record
                          </Link>
                        )}
                    </div>
                    <p className="mt-2 text-xs text-ink/60">{s.normalization}</p>
                  </div>
                );
              })}
            </div>
          </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h3 className="font-bold text-ink">Course details</h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              <Row label="Faculty" value={course.faculty.name} />
              <Row label="Campus" value={course.campus.name} />
              <Row label="Department" value={course.department.name} />
              <Row label="Credits" value={String(course.credits)} />
              <Row label="Configuration" value={combo?.label ?? course.combinationCode} />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/45">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
