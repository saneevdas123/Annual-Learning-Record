import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { getReviewQueue } from '@/lib/queries';
import { RECORD_TYPES, ROLE_LABELS, type RecordType } from '@/lib/domain';
import { PageHeader, EmptyState, SealDisc, Badge, StatCard } from '@/components/ui';
import { fmtDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const user = await requireRole('FACULTY', 'MENTOR', 'HOD', 'DEAN');
  const queue = await getReviewQueue(user);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${ROLE_LABELS[user.role]} · sign-off`}
        title="Review queue"
        subtitle="Records submitted to you for verification, scoring, and sign-off."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="ink" label="Awaiting review" value={queue.length} hint="in queue" />
        <StatCard
          tone="light"
          label="Under review"
          value={queue.filter((r) => r.status === 'UNDER_REVIEW').length}
        />
        <StatCard
          tone="light"
          label="Newly submitted"
          value={queue.filter((r) => r.status === 'SUBMITTED').length}
        />
      </div>

      {queue.length === 0 ? (
        <EmptyState title="All caught up" message="Nothing is waiting for your review right now." />
      ) : (
        <div className="card divide-y divide-indigo-100 overflow-hidden">
          {queue.map((r) => (
            <Link
              key={r.id}
              href={`/records/${r.id}`}
              className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-indigo-50/40"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-ink">{r.title}</span>
                  <Badge tone="muted">{RECORD_TYPES[r.recordType as RecordType].label}</Badge>
                </span>
                <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                  {r.student.name}
                  {r.student.registrationNumber ? ` · ${r.student.registrationNumber}` : ''} · {r.course.code}
                </span>
              </span>
              <span className="hidden font-mono text-[11px] text-ink-muted sm:block">
                {fmtDate(r.submittedAt)}
              </span>
              <SealDisc status={r.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
