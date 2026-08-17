import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { SealDisc, EmptyState, PageHead, Badge } from '@/components/ui';
import { AppTabs } from '@/components/AppTabs';
import { RECORD_TYPES, RECORD_STATUS_LABELS } from '@/lib/domain';
import { fmtDate } from '@/lib/utils';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMeta({
  title: 'My learning records',
  description: 'All learning records you have filed across enrolled courses.',
  path: '/records',
});

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'DRAFT', label: RECORD_STATUS_LABELS.DRAFT },
  { key: 'SUBMITTED', label: RECORD_STATUS_LABELS.SUBMITTED },
  { key: 'UNDER_REVIEW', label: RECORD_STATUS_LABELS.UNDER_REVIEW },
  { key: 'REVISION', label: RECORD_STATUS_LABELS.REVISION },
  { key: 'APPROVED', label: RECORD_STATUS_LABELS.APPROVED },
] as const;

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole('STUDENT');
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.key === rawTab) ? rawTab! : 'all';

  const records = await db.learningRecord.findMany({
    where: { studentId: user.id },
    include: { course: { select: { code: true, title: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  const shown = tab === 'all' ? records : records.filter((r) => r.status === tab);

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="The ledger"
        title="My learning records"
        subtitle={`${records.length} ${records.length === 1 ? 'record' : 'records'} across your courses.`}
      />

      {records.length === 0 ? (
        <EmptyState
          title="No records yet"
          message="Your dashboard lists each course's required records. Start one from there."
          action={
            <Link href="/dashboard" className="btn-primary">
              Go to dashboard
            </Link>
          }
        />
      ) : (
        <>
          <AppTabs
            active={tab}
            tabs={TABS.map((t) => ({
              key: t.key,
              label: t.label,
              href: t.key === 'all' ? '/records' : `/records?tab=${t.key}`,
              count: t.key === 'all' ? records.length : records.filter((r) => r.status === t.key).length,
            }))}
          />

          {shown.length === 0 ? (
            <EmptyState title="Nothing in this tab" message="Try another status, or file a new record from a course." />
          ) : (
            <>
              <div className="hidden md:block table-wrap">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="th">Record</th>
                      <th className="th">Course</th>
                      <th className="th">Updated</th>
                      <th className="th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => (
                      <tr key={r.id}>
                        <td className="td">
                          <Link href={`/records/${r.id}`} className="font-semibold hover:text-brand">
                            {r.title}
                          </Link>
                          <div className="mt-0.5">
                            <Badge tone="muted">{RECORD_TYPES[r.recordType].label}</Badge>
                          </div>
                        </td>
                        <td className="td text-ink/60">
                          {r.course.code}
                          {r.normalizedScore != null && ` · ${r.normalizedScore}/${r.subjectWeightPct}`}
                        </td>
                        <td className="td text-ink/55">{fmtDate(r.updatedAt)}</td>
                        <td className="td">
                          <SealDisc status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-2">
                {shown.map((r) => (
                  <Link key={r.id} href={`/records/${r.id}`} className="ui-nest block p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-ink">{r.title}</span>
                      <SealDisc status={r.status} />
                    </div>
                    <p className="mt-1 text-xs text-ink/50">
                      {r.course.code} · {r.academicYear}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
