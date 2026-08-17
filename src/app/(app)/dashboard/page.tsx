import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { getStudentTrace, getStudentSummary, getReviewQueue, getAnalyticsOverview } from '@/lib/queries';
import { db } from '@/lib/db';
import { Stat, SealDisc, EmptyState, Progress, PageHead, Badge } from '@/components/ui';
import { ALR_CREDITS_PER_YEAR } from '@/lib/domain';
import { fmtDate } from '@/lib/utils';
import { studentOrgWhere } from '@/lib/access';
import type { CurrentUser } from '@/lib/session';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMeta({
  title: 'Overview',
  description: 'Your CUTM Annual Learning Record dashboard — courses, submissions, reviews, and credits.',
  path: '/dashboard',
});

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === 'STUDENT') return <StudentDashboard user={user} />;
  if (['FACULTY', 'MENTOR'].includes(user.role)) return <ReviewerDashboard user={user} />;
  return <StaffDashboard user={user} />;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

async function StudentDashboard({ user }: { user: CurrentUser }) {
  const [trace, summary, program] = await Promise.all([
    getStudentTrace(user.id),
    getStudentSummary(user.id),
    user.programId
      ? db.program.findUnique({ where: { id: user.programId }, select: { durationYears: true } })
      : null,
  ]);
  const maxCredits = (program?.durationYears ?? 4) * ALR_CREDITS_PER_YEAR;

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow={fmtDate(new Date())}
        title={`${greeting()}, ${user.name.split(' ')[0]}.`}
        subtitle="Your learning, recorded course by course and carried into credit."
      />

      {!user.eDeclarationAt ? (
        <div className="ui-callout-warn p-4">
          <p className="font-bold text-ink">Academic integrity declaration</p>
          <p className="mt-1 text-sm text-ink/70">
            Accept the declaration on your profile before you can file or submit learning records.
          </p>
          <Link href="/profile" className="mt-3 inline-flex btn-primary !py-2 !px-4 text-sm">
            Open profile
          </Link>
        </div>
      ) : null}

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat tone="gray" label="Courses enrolled" value={summary.courses} sub="this record" />
        <Stat tone="brand" label="Records filed" value={summary.totalRecords} sub="all types" />
        <Stat tone="amber" label="Awaiting review" value={summary.pending} sub="in queue" />
        <Stat tone="green" label="ALR credits" value={summary.credits} sub="compulsory basket" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Your learning ledger</h2>
          <Link href="/records" className="text-sm font-semibold text-brand hover:underline">
            All records
          </Link>
        </div>

        {trace.length === 0 ? (
          <EmptyState
            title="No enrolled courses yet"
            message="Once you're enrolled in courses, each one's required learning records appear here to complete."
          />
        ) : (
          <div className="card overflow-hidden divide-y divide-ink/10">
            {trace.map((row) => (
              <div key={row.courseId} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink/45">{row.code}</span>
                      <Badge tone="muted">{row.combinationLabel}</Badge>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-ink">{row.title}</h3>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">{row.academicYear}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-ink">
                      {row.subjectTotal}
                      <span className="text-sm text-ink/45">/{row.subjectMax}</span>
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink/45">subject weight</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {row.required.map((req) => (
                    <div key={req.type} className="ui-nest flex items-center gap-3 px-3 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{req.label}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-ink/45">
                          weight {req.weightPct}%
                          {req.normalizedScore != null && ` · scored ${req.normalizedScore}`}
                        </span>
                      </span>
                      {req.status ? (
                        <>
                          <SealDisc status={req.status} />
                          <Link href={`/records/${req.recordId}`} className="text-xs font-semibold text-brand">
                            Open
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={`/records/new?courseId=${row.courseId}&type=${req.type}`}
                          className="btn-primary !px-3 !py-1.5 text-xs"
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">Credit progress</h3>
            <p className="text-sm text-ink/55">
              The ALR carries {ALR_CREDITS_PER_YEAR} credit per year in the Compulsory Basket.
            </p>
          </div>
          <Link href="/credits" className="btn-ghost !px-3 !py-1.5 text-xs">
            View ledger
          </Link>
        </div>
        <div className="mt-4">
          <Progress value={summary.credits} max={maxCredits} />
          <p className="mt-1.5 text-[11px] font-semibold text-ink/45">
            {summary.credits} of {maxCredits} program credits posted
          </p>
        </div>
      </div>
    </div>
  );
}

async function ReviewerDashboard({ user }: { user: CurrentUser }) {
  const queue = await getReviewQueue(user);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = queue.filter((r) => r.submittedAt && r.submittedAt >= weekAgo).length;

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow={fmtDate(new Date())}
        title={`${greeting()}, ${user.name.split(' ')[0]}.`}
        subtitle="Records submitted to you for verification and sign-off."
      />
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
        <Stat tone="gray" label="Awaiting review" value={queue.length} sub="in queue" />
        <Stat tone="brand" label="Role" value={user.role === 'FACULTY' ? 'Faculty' : 'Mentor'} />
        <Stat tone="amber" label="This week" value={thisWeek} sub="submitted" />
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Review queue</h2>
          <Link href="/review" className="text-sm font-semibold text-brand hover:underline">
            Open queue
          </Link>
        </div>
        {queue.length === 0 ? (
          <EmptyState title="All caught up" message="No records are waiting for your review." />
        ) : (
          <div className="card overflow-hidden divide-y divide-ink/10">
            {queue.slice(0, 8).map((r) => (
              <Link key={r.id} href={`/records/${r.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink/[0.02]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{r.title}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
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

async function StaffDashboard({ user }: { user: CurrentUser }) {
  const [ov, pendingEvals] = await Promise.all([
    getAnalyticsOverview(user),
    db.yearEvaluation.count({
      where: {
        status: { in: ['PENDING', 'IN_REVIEW'] },
        student: studentOrgWhere(user),
      },
    }),
  ]);
  const submitted = ov.byStatus.find((s) => s.status === 'SUBMITTED')?._count ?? 0;
  return (
    <div className="space-y-6">
      <PageHead
        eyebrow={fmtDate(new Date())}
        title={`${greeting()}, ${user.name.split(' ')[0]}.`}
        subtitle="Institution-wide learning records, evaluations, and credit."
      />
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat tone="gray" label="Students" value={ov.students} />
        <Stat tone="brand" label="Records filed" value={ov.records} />
        <Stat tone="red" label="Submitted" value={submitted} sub="awaiting" />
        <Stat tone="amber" label="Evaluations pending" value={pendingEvals} sub="year-wise" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/evaluations" className="card p-5 land-card">
          <h3 className="text-lg font-bold text-ink">Run evaluations</h3>
          <p className="mt-1 text-sm text-ink/55">
            Year-wise and program-wise committee review, rubric sign-off, and exam-cell export.
          </p>
        </Link>
        <Link href="/analytics" className="card p-5 land-card">
          <h3 className="text-lg font-bold text-ink">Open analytics</h3>
          <p className="mt-1 text-sm text-ink/55">Records by type and campus, submission trends, and credit posting.</p>
        </Link>
      </div>
    </div>
  );
}
