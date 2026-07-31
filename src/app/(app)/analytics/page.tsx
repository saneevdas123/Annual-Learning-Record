import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { getAnalyticsOverview } from '@/lib/queries';
import { RECORD_TYPES, RECORD_STATUS_LABELS, type RecordType } from '@/lib/domain';
import { PageHeader, StatCard } from '@/components/ui';
import { CategoryBarChart } from '@/components/AnalyticsCharts';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  await requireRole('HOD', 'DEAN', 'ADMIN');
  const ov = await getAnalyticsOverview();

  const campuses = await db.campus.findMany({ select: { id: true, name: true } });
  const campusName = new Map<string, string>(campuses.map((c: any) => [c.id, c.name]));

  const byType = ov.byType.map((t) => ({
    name: RECORD_TYPES[t.recordType as RecordType]?.label.replace('Record of ', '') ?? t.recordType,
    value: t._count,
  }));
  const byStatus = ov.byStatus.map((s) => ({
    name: RECORD_STATUS_LABELS[s.status] ?? s.status,
    value: s._count,
  }));
  const byCampus = ov.byCampus.map((c) => ({
    name: campusName.get(c.campusId) ?? '—',
    value: c._count,
  }));

  const [creditsAgg, approved, plagiarismOpen] = await Promise.all([
    db.creditLedgerEntry.aggregate({ _sum: { credits: true } }),
    db.learningRecord.count({ where: { status: 'APPROVED' } }),
    db.plagiarismCase.count({ where: { status: { notIn: ['CLOSED'] } } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Institution"
        title="Analytics"
        subtitle="Learning records by type, status, and campus — the evidence base for NAAC/NBA accreditation exports."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard tone="ink" label="Students" value={ov.students} />
        <StatCard tone="light" label="Faculty" value={ov.faculty} />
        <StatCard tone="light" label="Records approved" value={approved} hint={`of ${ov.records}`} />
        <StatCard tone="brass" label="Credits posted" value={creditsAgg._sum.credits ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-lg text-ink">Records by type</h2>
          <p className="mb-2 text-sm text-ink-muted">Across all twelve subject configurations.</p>
          <CategoryBarChart data={byType} />
        </section>

        <section className="card p-5">
          <h2 className="font-display text-lg text-ink">Records by status</h2>
          <p className="mb-2 text-sm text-ink-muted">Where records sit in the sign-off pipeline.</p>
          <CategoryBarChart data={byStatus} />
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-lg text-ink">Records by campus</h2>
          <p className="mb-2 text-sm text-ink-muted">Filterable evidence base across the six campuses.</p>
          <CategoryBarChart data={byCampus} />
        </section>
      </div>

      <section className="card p-5">
        <h2 className="font-display text-lg text-ink">Integrity &amp; accreditation</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-indigo-100 bg-white p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">Open plagiarism cases</p>
            <p className="mt-1 font-mono text-2xl text-ink">{plagiarismOpen}</p>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-white p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">Approval rate</p>
            <p className="mt-1 font-mono text-2xl text-ink">
              {ov.records ? Math.round((approved / ov.records) * 100) : 0}%
            </p>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-white p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">Export readiness</p>
            <p className="mt-1 text-sm text-ink-soft">
              Approved records carry CO/PO evidence for NAAC &amp; NBA reporting.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
