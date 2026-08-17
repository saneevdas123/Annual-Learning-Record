import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { getReviewQueue } from '@/lib/queries';
import { RECORD_TYPES, ROLE_LABELS, type RecordType } from '@/lib/domain';
import { PageHead, EmptyState, SealDisc, Badge, Stat } from '@/components/ui';
import { fmtDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const user = await requireRole('FACULTY', 'MENTOR', 'HOD', 'DEAN');
  const queue = await getReviewQueue(user);

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow={`${ROLE_LABELS[user.role]} · sign-off`}
        title="Review queue"
        subtitle="Records submitted to you for verification, scoring, and sign-off."
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
        <Stat tone="gray" label="Awaiting review" value={queue.length} sub="in queue" />
        <Stat tone="brand" label="Under review" value={queue.filter((r) => r.status === 'UNDER_REVIEW').length} />
        <Stat tone="amber" label="Newly submitted" value={queue.filter((r) => r.status === 'SUBMITTED').length} />
      </div>

      {queue.length === 0 ? (
        <EmptyState title="All caught up" message="Nothing is waiting for your review right now." />
      ) : (
        <>
          <div className="hidden md:block table-wrap">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Record</th>
                  <th className="th">Student</th>
                  <th className="th">Submitted</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((r) => (
                  <tr key={r.id}>
                    <td className="td">
                      <Link href={`/records/${r.id}`} className="font-semibold hover:text-brand">
                        {r.title}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        <Badge tone="muted">{RECORD_TYPES[r.recordType as RecordType].label}</Badge>
                        {r.appeals.length > 0 && <Badge tone="red">Appeal</Badge>}
                      </div>
                    </td>
                    <td className="td text-ink/60">
                      {r.student.name}
                      {r.student.registrationNumber ? ` · ${r.student.registrationNumber}` : ''} · {r.course.code}
                    </td>
                    <td className="td text-ink/55">{fmtDate(r.submittedAt)}</td>
                    <td className="td">
                      <SealDisc status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-2">
            {queue.map((r) => (
              <Link key={r.id} href={`/records/${r.id}`} className="ui-nest block p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-ink">{r.title}</span>
                  <SealDisc status={r.status} />
                </div>
                <p className="mt-1 text-xs text-ink/50">
                  {r.student.name} · {r.course.code}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
