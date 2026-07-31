import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { db } from '@/lib/db';
import { COMBINATIONS, requiredRecordTypes, RECORD_TYPES } from '@/lib/domain';
import { PageHeader, EmptyState, Badge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const user = await requireUser();

  let courses: any[] = [];
  let subtitle = '';

  if (user.role === 'STUDENT') {
    const enrollments = await db.enrollment.findMany({
      where: { studentId: user.id },
      include: { course: { include: { faculty: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    courses = enrollments.map((e) => e.course);
    subtitle = 'The courses you are enrolled in and their required learning records.';
  } else if (user.role === 'FACULTY') {
    courses = await db.course.findMany({
      where: { facultyId: user.id },
      include: { faculty: { select: { name: true } }, _count: { select: { enrollments: true, records: true } } },
      orderBy: { createdAt: 'desc' },
    });
    subtitle = 'Courses you teach. Open one to see submissions and required records.';
  } else {
    courses = await db.course.findMany({
      include: { faculty: { select: { name: true } }, _count: { select: { enrollments: true, records: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    subtitle = 'All courses across the institution.';
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Catalogue" title="Courses" subtitle={subtitle} />

      {courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          message={
            user.role === 'ADMIN'
              ? 'Create courses from Administration to begin.'
              : 'Courses will appear here once they are set up and you are assigned.'
          }
          action={
            user.role === 'ADMIN' ? (
              <Link href="/admin" className="btn-primary">
                Go to Administration
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => {
            const combo = COMBINATIONS[c.combinationCode as keyof typeof COMBINATIONS];
            const reqs = requiredRecordTypes(c.combinationCode as never);
            return (
              <Link key={c.id} href={`/courses/${c.id}`} className="card p-5 transition hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-muted">{c.code}</span>
                  <Badge tone="indigo">{combo?.label ?? c.combinationCode}</Badge>
                </div>
                <h3 className="mt-1 font-display text-lg text-ink">{c.title}</h3>
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                  {c.academicYear} · {c.term} · {c.credits} cr
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {reqs.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-brass-100 bg-brass-50 px-1.5 py-0.5 font-mono text-[10px] text-brass-600"
                    >
                      {RECORD_TYPES[t].label} · {RECORD_TYPES[t].weightPct}%
                    </span>
                  ))}
                </div>
                {c._count && (
                  <p className="mt-3 font-mono text-[11px] text-ink-muted">
                    {c._count.enrollments} enrolled · {c._count.records} records
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
