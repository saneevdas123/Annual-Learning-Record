import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { PageHead, EmptyState, SealDisc, Stat } from '@/components/ui';
import { currentAcademicYear, academicYearOptions } from '@/lib/utils';
import { ANNUAL_RUBRIC as RUBRIC } from '@/lib/domain';
import { studentOrgWhere } from '@/lib/access';
import {
  saveYearEvaluation,
  signoffYearEvaluation,
  exportYearEvaluation,
  compileProgramEvaluation,
  exportProgramEvaluation,
} from './actions';
import { ActionForm } from '@/components/ActionForm';
import { AppTabs } from '@/components/AppTabs';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMeta({
  title: 'Evaluations',
  description: 'Year-wise and program-wise committee scoring, sign-off, and exam-cell export.',
  path: '/evaluations',
});

export default async function EvaluationsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; q?: string; tab?: string }>;
}) {
  const user = await requireRole('HOD', 'DEAN', 'ADMIN');
  const sp = await searchParams;
  const year = sp.year || currentAcademicYear();
  const q = (sp.q ?? '').trim().toLowerCase();
  const canProgram = user.role !== 'HOD';
  const tab = canProgram && sp.tab === 'program' ? 'program' : 'year';

  const students = await db.user.findMany({
    where: studentOrgWhere(user),
    select: { id: true, name: true, registrationNumber: true, programId: true },
    orderBy: { name: 'asc' },
    take: 300,
  });
  const visible = q
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.registrationNumber ?? '').toLowerCase().includes(q)
      )
    : students;
  const ids = visible.map((s) => s.id);

  const [yearEvals, programEvals, approvedCounts] = await Promise.all([
    db.yearEvaluation.findMany({
      where: { academicYear: year, studentId: { in: ids.length ? ids : ['__none__'] } },
    }),
    db.programEvaluation.findMany({ where: { studentId: { in: ids.length ? ids : ['__none__'] } } }),
    db.learningRecord.groupBy({
      by: ['studentId'],
      where: { academicYear: year, status: 'APPROVED', studentId: { in: ids.length ? ids : ['__none__'] } },
      _count: true,
    }),
  ]);

  const evalByStudent = new Map(yearEvals.map((e) => [e.studentId, e]));
  const progByStudent = new Map(programEvals.map((e) => [e.studentId, e]));
  const approvedByStudent = new Map(approvedCounts.map((c) => [c.studentId, c._count]));

  const signedOff = yearEvals.filter((e) => ['SIGNED_OFF', 'EXPORTED'].includes(e.status)).length;
  const pending = visible.filter((s) => {
    const ev = evalByStudent.get(s.id);
    return !ev || ev.status === 'PENDING';
  }).length;

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="Committee review"
        title="Evaluations"
        subtitle="Year-wise annual record scoring, sign-off, credit posting, and program compilation."
        action={
          <form className="flex flex-wrap items-center gap-2">
            <input
              name="q"
              defaultValue={sp.q ?? ''}
              className="input !w-44 !py-1.5 text-sm"
              placeholder="Search student…"
            />
            <input type="hidden" name="tab" value={tab} />
            <select name="year" defaultValue={year} className="input !w-auto !py-1.5 text-sm">
              {academicYearOptions().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button className="btn-ghost !px-3 !py-1.5 text-xs">Filter</button>
          </form>
        }
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
        <Stat tone="gray" label="Students in scope" value={visible.length} sub={year} />
        <Stat tone="green" label="Signed off" value={signedOff} sub="this year" />
        <Stat tone="amber" label="Awaiting evaluation" value={pending} />
      </div>

      {canProgram ? (
        <AppTabs
          active={tab}
          tabs={[
            {
              key: 'year',
              label: 'Year-wise',
              href: `/evaluations?tab=year&year=${encodeURIComponent(year)}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`,
              count: visible.length,
            },
            {
              key: 'program',
              label: 'Program-wise',
              href: `/evaluations?tab=program&year=${encodeURIComponent(year)}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`,
              count: visible.filter((s) => progByStudent.has(s.id)).length,
            },
          ]}
        />
      ) : (
        <h2 className="text-lg font-bold text-ink">Year-wise · {year}</h2>
      )}

      {visible.length === 0 ? (
        <EmptyState title="No students in scope" message="No students match your department/campus or search." />
      ) : tab === 'year' ? (
        <section className="space-y-3">
          {canProgram ? <h2 className="text-lg font-bold text-ink">Year-wise · {year}</h2> : null}
          {visible.map((s) => {
            const ev = evalByStudent.get(s.id);
            const approved = approvedByStudent.get(s.id) ?? 0;
            return (
              <details key={s.id} className="card overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 hover:bg-ink/[0.02]">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{s.name}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                      {s.registrationNumber ?? '—'} · {approved} approved records
                    </span>
                  </span>
                  {ev?.totalMark != null && <span className="text-sm font-bold text-ink">{ev.totalMark}/100</span>}
                  <SealDisc status={ev?.status ?? 'PENDING'} />
                </summary>

                <div className="border-t border-ink/10 bg-cream/40 p-5">
                  <ActionForm action={saveYearEvaluation} success="Rubric saved." className="space-y-4">
                    <input type="hidden" name="studentId" value={s.id} />
                    <input type="hidden" name="academicYear" value={year} />
                    <div className="grid gap-3 sm:grid-cols-5">
                      {RUBRIC.map((c) => (
                        <div key={c.key}>
                          <label className="label text-[11px]">{c.label}</label>
                          <input
                            name={c.key}
                            type="number"
                            min="0"
                            max={c.max}
                            defaultValue={(ev as Record<string, number> | undefined)?.[c.key] ?? 0}
                            className="input"
                          />
                          <p className="mt-0.5 text-right text-[10px] font-bold text-ink/40">/{c.max}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button className="btn-ghost">Save rubric</button>
                    </div>
                  </ActionForm>

                  <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-ink/10 pt-3">
                    {ev && ev.status === 'IN_REVIEW' && (
                      <ActionForm action={signoffYearEvaluation} success="Year signed off.">
                        <input type="hidden" name="studentId" value={s.id} />
                        <input type="hidden" name="academicYear" value={year} />
                        <button className="btn-primary">Sign off &amp; post 1 credit</button>
                      </ActionForm>
                    )}
                    {ev && ev.status === 'SIGNED_OFF' && user.role !== 'HOD' && (
                      <ActionForm action={exportYearEvaluation} success="Exported to exam cell.">
                        <input type="hidden" name="studentId" value={s.id} />
                        <input type="hidden" name="academicYear" value={year} />
                        <button className="btn-primary">Export to exam cell</button>
                      </ActionForm>
                    )}
                    {ev?.examCellExportAt && (
                      <span className="self-center text-[11px] font-bold text-ink/55">Exported ✓</span>
                    )}
                  </div>
                </div>
              </details>
            );
          })}
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">Program-wise · cumulated</h2>
          <div className="card overflow-hidden divide-y divide-ink/10">
            {visible.map((s) => {
              const prog = progByStudent.get(s.id);
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{s.name}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                      {prog ? `final ${prog.finalMark ?? '—'} · ${prog.creditTotal ?? 0} credits` : 'not compiled'}
                    </span>
                  </span>
                  {prog && <SealDisc status={prog.status} />}
                  <ActionForm action={compileProgramEvaluation} success="Program compiled.">
                    <input type="hidden" name="studentId" value={s.id} />
                    <button className="btn-ghost !px-3 !py-1.5 text-xs">Compile</button>
                  </ActionForm>
                  {prog && prog.status !== 'EXPORTED' && (
                    <ActionForm action={exportProgramEvaluation} success="Program exported.">
                      <input type="hidden" name="studentId" value={s.id} />
                      <button className="btn-primary !px-3 !py-1.5 text-xs">Export</button>
                    </ActionForm>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
