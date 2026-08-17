import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { getAnalyticsOverview } from '@/lib/queries';
import { RECORD_TYPES, RECORD_STATUS_LABELS, type RecordType } from '@/lib/domain';
import { PageHead, Stat } from '@/components/ui';
import { AppTabs } from '@/components/AppTabs';
import { CategoryBarChart } from '@/components/AnalyticsCharts';
import { recordOrgWhere, studentOrgWhere } from '@/lib/access';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMeta({
  title: 'Analytics',
  description: 'Learning records by type, status, and campus — evidence for NAAC and NBA reporting.',
  path: '/analytics',
});

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole('HOD', 'DEAN', 'ADMIN');
  const { tab: rawTab } = await searchParams;
  const tab = ['type', 'status', 'campus', 'integrity'].includes(rawTab ?? '') ? rawTab! : 'type';
  const ov = await getAnalyticsOverview(user);

  const campuses = await db.campus.findMany({ select: { id: true, name: true } });
  const campusName = new Map(campuses.map((c) => [c.id, c.name]));

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

  const recordWhere = recordOrgWhere(user);
  const [creditsAgg, approved, plagiarismOpen] = await Promise.all([
    db.creditLedgerEntry.aggregate({
      where: { student: studentOrgWhere(user) },
      _sum: { credits: true },
    }),
    db.learningRecord.count({ where: { ...recordWhere, status: 'APPROVED' } }),
    db.plagiarismCase.count({ where: { status: { notIn: ['CLOSED'] } } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="Institution"
        title="Analytics"
        subtitle="Learning records by type, status, and campus — the evidence base for NAAC/NBA accreditation exports."
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat tone="gray" label="Students" value={ov.students} />
        <Stat tone="brand" label="Faculty" value={ov.faculty} />
        <Stat tone="green" label="Records approved" value={approved} sub={`of ${ov.records}`} />
        <Stat tone="amber" label="Credits posted" value={creditsAgg._sum.credits ?? 0} />
      </div>

      <AppTabs
        active={tab}
        tabs={[
          { key: 'type', label: 'By type', href: '/analytics?tab=type', count: byType.reduce((s, r) => s + r.value, 0) },
          { key: 'status', label: 'By status', href: '/analytics?tab=status', count: byStatus.reduce((s, r) => s + r.value, 0) },
          { key: 'campus', label: 'By campus', href: '/analytics?tab=campus', count: byCampus.length },
          { key: 'integrity', label: 'Integrity', href: '/analytics?tab=integrity', count: plagiarismOpen },
        ]}
        panels={{
          type: (
        <section className="card p-5">
          <h2 className="text-lg font-bold text-ink">Records by type</h2>
          <p className="mb-2 text-sm text-ink/55">Across all twelve subject configurations.</p>
          <CategoryBarChart data={byType} />
        </section>
          ),
          status: (
        <section className="card p-5">
          <h2 className="text-lg font-bold text-ink">Records by status</h2>
          <p className="mb-2 text-sm text-ink/55">Where records sit in the sign-off pipeline.</p>
          <CategoryBarChart data={byStatus} />
        </section>
          ),
          campus: (
        <section className="card p-5">
          <h2 className="text-lg font-bold text-ink">Records by campus</h2>
          <p className="mb-2 text-sm text-ink/55">Filterable evidence base across the six campuses.</p>
          <CategoryBarChart data={byCampus} />
        </section>
          ),
          integrity: (
      <section className="card p-5">
        <h2 className="text-lg font-bold text-ink">Integrity &amp; accreditation</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="ui-nest p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">Open plagiarism cases</p>
            <p className="mt-1 text-2xl font-bold text-ink">{plagiarismOpen}</p>
          </div>
          <div className="ui-nest p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">Approval rate</p>
            <p className="mt-1 text-2xl font-bold text-ink">
              {ov.records ? Math.round((approved / ov.records) * 100) : 0}%
            </p>
          </div>
          <div className="ui-nest p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">Export readiness</p>
            <p className="mt-1 text-sm text-ink/60">
              Approved records carry CO/PO evidence for NAAC &amp; NBA reporting.
            </p>
          </div>
        </div>
      </section>
          ),
        }}
      />
    </div>
  );
}
