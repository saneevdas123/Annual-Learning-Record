import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { SealDisc, EmptyState, PageHeader, Badge } from '@/components/ui';
import { RECORD_TYPES } from '@/lib/domain';
import { fmtDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function RecordsPage() {
  const user = await requireRole('STUDENT');
  const records = await db.learningRecord.findMany({
    where: { studentId: user.id },
    include: { course: { select: { code: true, title: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <PageHeader
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
        <div className="card divide-y divide-indigo-100 overflow-hidden">
          {records.map((r, i) => (
            <Link
              key={r.id}
              href={`/records/${r.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-indigo-50/40"
            >
              <span className="hidden font-mono text-xs text-ink-muted sm:block">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-ink">{r.title}</span>
                  <Badge tone="muted">{RECORD_TYPES[r.recordType].label}</Badge>
                </span>
                <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                  {r.course.code} · {r.academicYear}
                  {r.normalizedScore != null && ` · scored ${r.normalizedScore}/${r.subjectWeightPct}`}
                </span>
              </span>
              <span className="hidden text-xs text-ink-muted md:block">{fmtDate(r.updatedAt)}</span>
              <SealDisc status={r.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
