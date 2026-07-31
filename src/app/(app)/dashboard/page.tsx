import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { getStudentTrace, getStudentSummary, getReviewQueue, getAnalyticsOverview } from '@/lib/queries';
import { db } from '@/lib/db';
import { StatCard, SealDisc, EmptyState, Progress, PageHeader, Badge } from '@/components/ui';
import { ALR_CREDITS_PER_YEAR } from '@/lib/domain';
import { fmtDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === 'STUDENT') return <StudentDashboard userId={user.id} name={user.name} />;
  if (['FACULTY', 'MENTOR'].includes(user.role))
    return <ReviewerDashboard user={user} name={user.name} />;
  return <StaffDashboard name={user.name} role={user.role} />;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

async function StudentDashboard({ userId, name }: { userId: string; name: string }) {
  const [trace, summary] = await Promise.all([getStudentTrace(userId), getStudentSummary(userId)]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={fmtDate(new Date())}
        title={`${greeting()}, ${name.split(' ')[0]}.`}
        subtitle="Your learning, recorded course by course and carried into credit."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard tone="ink" label="Courses enrolled" value={summary.courses} hint="this record" />
        <StatCard tone="light" label="Records filed" value={summary.totalRecords} hint="all types" />
        <StatCard tone="light" label="Awaiting review" value={summary.pending} hint="in queue" />
        <StatCard tone="brass" label="ALR credits" value={summary.credits} hint="compulsory basket" />
      </div>

      {/* The signature element: the learning ledger. */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Your learning ledger</h2>
          <Link href="/records" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            All records
          </Link>
        </div>

        {trace.length === 0 ? (
          <EmptyState
            title="No enrolled courses yet"
            message="Once you're enrolled in courses, each one's required learning records appear here to complete."
          />
        ) : (
          <div className="card divide-y divide-indigo-100 overflow-hidden">
            {trace.map((row) => (
              <div key={row.courseId} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-muted">{row.code}</span>
                      <Badge tone="muted">{row.combinationLabel}</Badge>
                    </div>
                    <h3 className="mt-1 font-display text-lg text-ink">{row.title}</h3>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                      {row.academicYear}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-2xl font-semibold text-ink">
                      {row.subjectTotal}
                      <span className="text-sm text-ink-muted">/{row.subjectMax}</span>
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                      subject weight
                    </p>
                  </div>
                </div>

                {/* Required records for this combination — the multi-record awareness. */}
                <div className="mt-4 space-y-2">
                  {row.required.map((req) => (
                    <div
                      key={req.type}
                      className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-white px-3 py-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {req.label}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                          weight {req.weightPct}%
                          {req.normalizedScore != null && ` · scored ${req.normalizedScore}`}
                        </span>
                      </span>
                      {req.status ? (
                        <>
                          <SealDisc status={req.status} />
                          <Link
                            href={`/records/${req.recordId}`}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Open
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={`/records/new?courseId=${row.courseId}&type=${req.type}`}
                          className="btn-seal px-3 py-1.5 text-xs"
                        >
                          File record
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg text-ink">Credit progress</h3>
            <p className="text-sm text-ink-muted">
              The ALR carries {ALR_CREDITS_PER_YEAR} credit per year in the Compulsory Basket.
            </p>
          </div>
          <Link href="/credits" className="btn-outline px-3 py-1.5 text-xs">
            View ledger
          </Link>
        </div>
        <div className="mt-4">
          <Progress value={summary.credits} max={4} />
          <p className="mt-1.5 font-mono text-[11px] text-ink-muted">
            {summary.credits} of 4 program credits posted
          </p>
        </div>
      </div>
    </div>
  );
}

async function ReviewerDashboard({
  user,
  name,
}: {
  user: { id: string; role: string };
  name: string;
}) {
  const queue = await getReviewQueue(user);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={fmtDate(new Date())}
        title={`${greeting()}, ${name.split(' ')[0]}.`}
        subtitle="Records submitted to you for verification and sign-off."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="ink" label="Awaiting review" value={queue.length} hint="in queue" />
        <StatCard tone="light" label="Role" value={user.role === 'FACULTY' ? 'Faculty' : 'Mentor'} />
        <StatCard tone="light" label="This week" value={queue.length} hint="submitted" />
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Review queue</h2>
          <Link href="/review" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Open queue
          </Link>
        </div>
        {queue.length === 0 ? (
          <EmptyState title="All caught up" message="No records are waiting for your review." />
        ) : (
          <div className="card divide-y divide-indigo-100 overflow-hidden">
            {queue.slice(0, 8).map((r) => (
              <Link
                key={r.id}
                href={`/records/${r.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-indigo-50/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{r.title}</span>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                    {r.student.name} · {r.course.code}
                  </span>
                </span>
                <SealDisc status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function StaffDashboard({ name, role }: { name: string; role: string }) {
  const [ov, pendingEvals] = await Promise.all([
    getAnalyticsOverview(),
    db.yearEvaluation.count({ where: { status: { in: ['PENDING', 'IN_REVIEW'] } } }),
  ]);
  const submitted = ov.byStatus.find((s) => s.status === 'SUBMITTED')?._count ?? 0;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={fmtDate(new Date())}
        title={`${greeting()}, ${name.split(' ')[0]}.`}
        subtitle="Institution-wide learning records, evaluations, and credit."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard tone="ink" label="Students" value={ov.students} />
        <StatCard tone="light" label="Records filed" value={ov.records} />
        <StatCard tone="seal" label="Submitted" value={submitted} hint="awaiting" />
        <StatCard tone="brass" label="Evaluations pending" value={pendingEvals} hint="year-wise" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/evaluations" className="card p-5 transition hover:shadow-lift">
          <h3 className="font-display text-lg text-ink">Run evaluations</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Year-wise and program-wise committee review, rubric sign-off, and exam-cell export.
          </p>
        </Link>
        <Link href="/analytics" className="card p-5 transition hover:shadow-lift">
          <h3 className="font-display text-lg text-ink">Open analytics</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Records by type and campus, submission trends, and credit posting.
          </p>
        </Link>
      </div>
    </div>
  );
}
