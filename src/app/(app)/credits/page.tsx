import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { PageHead, EmptyState, Stat, Badge, Progress } from '@/components/ui';
import { fmtDate } from '@/lib/utils';
import { ALR_CREDITS_PER_YEAR } from '@/lib/domain';
import { studentOrgWhere } from '@/lib/access';

export const dynamic = 'force-dynamic';

export default async function CreditsPage() {
  const user = await requireRole('STUDENT', 'HOD', 'DEAN', 'ADMIN');
  const isStudent = user.role === 'STUDENT';

  if (isStudent) {
    const [entries, program] = await Promise.all([
      db.creditLedgerEntry.findMany({
        where: { studentId: user.id },
        orderBy: { academicYear: 'asc' },
      }),
      user.programId
        ? db.program.findUnique({ where: { id: user.programId }, select: { durationYears: true } })
        : null,
    ]);
    const total = entries.reduce((s, e) => s + e.credits, 0);
    const maxCredits = (program?.durationYears ?? 4) * ALR_CREDITS_PER_YEAR;

    return (
      <div className="space-y-6">
        <PageHead
          eyebrow="Compulsory basket"
          title="Credit ledger"
          subtitle="Your Annual Learning Record carries 1 credit per year into the academic record."
        />

        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
          <Stat tone="green" label="Credits posted" value={total} sub="ALR total" />
          <Stat tone="brand" label="Years recorded" value={entries.length} />
          <Stat tone="amber" label="Exported to exam cell" value={entries.filter((e) => e.examCellRef).length} />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink">Progress toward program credit</h3>
            <span className="text-xs font-semibold text-ink/45">
              {total}/{maxCredits}
            </span>
          </div>
          <div className="mt-3">
            <Progress value={total} max={maxCredits} />
          </div>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            title="No credits posted yet"
            message="Credits are posted when your annual record is signed off by the Dean's committee."
          />
        ) : (
          <div className="card overflow-hidden divide-y divide-ink/10">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-sm font-bold text-ink">{e.academicYear}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <Badge tone="amber">{e.basket}</Badge>
                    <span className="text-[11px] text-ink/45">{e.source}</span>
                  </span>
                  {e.examCellRef && (
                    <span className="mt-0.5 block text-[10px] font-semibold text-ink/55">{e.examCellRef}</span>
                  )}
                </span>
                <span className="text-lg font-bold text-ink">
                  {e.credits}
                  <span className="text-xs text-ink/45"> cr</span>
                </span>
                <span className="hidden text-[11px] text-ink/45 sm:block">{fmtDate(e.postedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const scope = studentOrgWhere(user);
  const entries = await db.creditLedgerEntry.findMany({
    where: { student: scope },
    orderBy: { postedAt: 'desc' },
    take: 100,
    include: { student: { select: { name: true, registrationNumber: true } } },
  });
  const total = await db.creditLedgerEntry.aggregate({
    where: { student: scope },
    _sum: { credits: true },
  });

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="Compulsory basket"
        title="Credit ledger"
        subtitle="Credits posted from signed-off annual records in your scope."
      />
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
        <Stat tone="green" label="Total credits posted" value={total._sum.credits ?? 0} />
        <Stat tone="brand" label="Postings shown" value={entries.length} sub="most recent" />
        <Stat tone="amber" label="Exported" value={entries.filter((e) => e.examCellRef).length} />
      </div>
      {entries.length === 0 ? (
        <EmptyState title="No credits posted yet" message="Credits appear here as annual evaluations are signed off." />
      ) : (
        <div className="card overflow-hidden divide-y divide-ink/10">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{e.student.name}</span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                  {e.student.registrationNumber ?? '—'} · {e.academicYear}
                </span>
              </span>
              {e.examCellRef && <Badge tone="amber">exported</Badge>}
              <span className="text-sm font-bold text-ink">{e.credits} cr</span>
              <span className="hidden text-[11px] text-ink/45 sm:block">{fmtDate(e.postedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
