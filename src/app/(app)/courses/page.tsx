import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { db } from '@/lib/db';
import { COMBINATIONS, requiredRecordTypes, RECORD_TYPES } from '@/lib/domain';
import { PageHead, EmptyState, Badge } from '@/components/ui';
import { courseOrgWhere } from '@/lib/access';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMeta({
  title: 'Courses',
  description: 'Courses and required learning records in your CUTM ALR scope.',
  path: '/courses',
});

export default async function CoursesPage() {
  const user = await requireUser();

  let courses: Array<{
    id: string;
    code: string;
    title: string;
    combinationCode: string;
    academicYear: string;
    term: string;
    credits: number;
    faculty?: { name: string };
    _count?: { enrollments: number; records: number };
  }> = [];
  let subtitle = '';

  if (user.role === 'STUDENT') {
    const enrollments = await db.enrollment.findMany({
      where: { studentId: user.id },
      include: { course: { include: { faculty: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    courses = enrollments.map((e) => e.course);
    subtitle = 'The courses you are enrolled in and their required learning records.';
  } else {
    courses = await db.course.findMany({
      where: courseOrgWhere(user),
      include: { faculty: { select: { name: true } }, _count: { select: { enrollments: true, records: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    subtitle =
      user.role === 'FACULTY'
        ? 'Courses you teach. Open one to see submissions and required records.'
        : 'Courses in your scope.';
  }

  return (
    <div className="space-y-6">
      <PageHead eyebrow="Catalogue" title="Courses" subtitle={subtitle} />

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
              <Link key={c.id} href={`/courses/${c.id}`} className="card land-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink/45">{c.code}</span>
                  <Badge tone="blue">{combo?.label ?? c.combinationCode}</Badge>
                </div>
                <h3 className="mt-1 text-lg font-bold text-ink">{c.title}</h3>
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                  {c.academicYear} · {c.term} · {c.credits} cr
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {reqs.map((t) => (
                    <Badge key={t} tone="amber">
                      {RECORD_TYPES[t].label} · {RECORD_TYPES[t].weightPct}%
                    </Badge>
                  ))}
                </div>
                {c._count && (
                  <p className="mt-3 text-[11px] font-semibold text-ink/45">
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
