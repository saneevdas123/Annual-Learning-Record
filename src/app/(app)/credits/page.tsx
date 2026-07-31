import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { PageHeader, EmptyState, StatCard, Badge, Progress } from '@/components/ui';
import { fmtDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CreditsPage() {
  const user = await requireRole('STUDENT', 'HOD', 'DEAN', 'ADMIN');
  const isStudent = user.role === 'STUDENT';

  if (isStudent) {
    const entries = await db.creditLedgerEntry.findMany({
      where: { studentId: user.id },
      orderBy: { academicYear: 'asc' },
    });
    const total = entries.reduce((s, e) => s + e.credits, 0);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Compulsory basket"
          title="Credit ledger"
          subtitle="Your Annual Learning Record carries 1 credit per year into the academic record."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard tone="brass" label="Credits posted" value={total} hint="ALR total" />
          <StatCard tone="light" label="Years recorded" value={entries.length} />
          <StatCard
            tone="light"
            label="Exported to exam cell"
            value={entries.filter((e) => e.examCellRef).length}
          />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base text-ink">Progress toward program credit</h3>
            <span className="font-mono text-xs text-ink-muted">{total}/4</span>
          </div>
          <div className="mt-3">
            <Progress value={total} max={4} />
          </div>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            title="No credits posted yet"
            message="Credits are posted when your annual record is signed off by the Dean's committee."
          />
        ) : (
          <div className="card divide-y divide-indigo-100 overflow-hidden">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4">
                <span className="font-mono text-sm text-ink">{e.academicYear}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <Badge tone="brass">{e.basket}</Badge>
                    <span className="font-mono text-[11px] text-ink-muted">{e.source}</span>
                  </span>
                  {e.examCellRef && (
                    <span className="mt-0.5 block font-mono text-[10px] text-emerald-700">
                      {e.examCellRef}
                    </span>
                  )}
                </span>
                <span className="font-mono text-lg font-semibold text-ink">
                  {e.credits}
                  <span className="text-xs text-ink-muted"> cr</span>
                </span>
                <span className="hidden font-mono text-[11px] text-ink-muted sm:block">
                  {fmtDate(e.postedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Staff view: recent postings across the institution.
  const entries = await db.creditLedgerEntry.findMany({
    orderBy: { postedAt: 'desc' },
    take: 100,
    include: { student: { select: { name: true, registrationNumber: true } } },
  });
  const total = await db.creditLedgerEntry.aggregate({ _sum: { credits: true } });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compulsory basket"
        title="Credit ledger"
        subtitle="Credits posted from signed-off annual records across the institution."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="brass" label="Total credits posted" value={total._sum.credits ?? 0} />
        <StatCard tone="light" label="Postings shown" value={entries.length} hint="most recent" />
        <StatCard
          tone="light"
          label="Exported"
          value={entries.filter((e) => e.examCellRef).length}
        />
      </div>
      {entries.length === 0 ? (
        <EmptyState title="No credits posted yet" message="Credits appear here as annual evaluations are signed off." />
      ) : (
        <div className="card divide-y divide-indigo-100 overflow-hidden">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{e.student.name}</span>
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                  {e.student.registrationNumber ?? '—'} · {e.academicYear}
                </span>
              </span>
              {e.examCellRef && <Badge tone="brass">exported</Badge>}
              <span className="font-mono text-sm font-semibold text-ink">{e.credits} cr</span>
              <span className="hidden font-mono text-[11px] text-ink-muted sm:block">
                {fmtDate(e.postedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
