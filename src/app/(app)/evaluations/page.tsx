import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { PageHeader, EmptyState, SealDisc, StatCard } from '@/components/ui';
import { currentAcademicYear, academicYearOptions } from '@/lib/utils';
import { ANNUAL_RUBRIC as RUBRIC } from '@/lib/domain';
import {
  saveYearEvaluation,
  signoffYearEvaluation,
  exportYearEvaluation,
  compileProgramEvaluation,
  exportProgramEvaluation,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function EvaluationsPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const user = await requireRole('HOD', 'DEAN', 'ADMIN');
  const year = searchParams.year || currentAcademicYear();

  // Scope students by the reviewer's role.
  const scope: any =
    user.role === 'HOD'
      ? { role: 'STUDENT', departmentId: user.departmentId }
      : user.role === 'DEAN'
      ? { role: 'STUDENT', campusId: user.campusId }
      : { role: 'STUDENT' };

  const students = await db.user.findMany({
    where: scope,
    select: { id: true, name: true, registrationNumber: true, programId: true },
    orderBy: { name: 'asc' },
    take: 300,
  });
  const ids = students.map((s) => s.id);

  const [yearEvals, programEvals, approvedCounts] = await Promise.all([
    db.yearEvaluation.findMany({ where: { academicYear: year, studentId: { in: ids.length ? ids : ['__none__'] } } }),
    db.programEvaluation.findMany({ where: { studentId: { in: ids.length ? ids : ['__none__'] } } }),
    db.learningRecord.groupBy({
      by: ['studentId'],
      where: { academicYear: year, status: 'APPROVED', studentId: { in: ids.length ? ids : ['__none__'] } },
      _count: true,
    }),
  ]);

  const evalByStudent = new Map<string, any>(yearEvals.map((e: any) => [e.studentId, e]));
  const progByStudent = new Map<string, any>(programEvals.map((e: any) => [e.studentId, e]));
  const approvedByStudent = new Map<string, number>(approvedCounts.map((c: any) => [c.studentId, c._count]));

  const signedOff = yearEvals.filter((e) => ['SIGNED_OFF', 'EXPORTED'].includes(e.status)).length;
  const pending = students.length - yearEvals.filter((e) => e.status !== 'PENDING').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Committee review"
        title="Evaluations"
        subtitle="Year-wise annual record scoring, sign-off, credit posting, and program compilation."
        action={
          <form className="flex items-center gap-2">
            <select name="year" defaultValue={year} className="field w-auto py-1.5 text-sm">
              {academicYearOptions().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button className="btn-outline px-3 py-1.5 text-xs">Load</button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="ink" label="Students in scope" value={students.length} hint={year} />
        <StatCard tone="brass" label="Signed off" value={signedOff} hint="this year" />
        <StatCard tone="light" label="Awaiting evaluation" value={Math.max(0, pending)} />
      </div>

      {students.length === 0 ? (
        <EmptyState title="No students in scope" message="No students match your department/campus for this year." />
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-xl text-ink">Year-wise · {year}</h2>
          {students.map((s) => {
            const ev = evalByStudent.get(s.id);
            const approved = approvedByStudent.get(s.id) ?? 0;
            return (
              <details key={s.id} className="card overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 hover:bg-indigo-50/40">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{s.name}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                      {s.registrationNumber ?? '—'} · {approved} approved records
                    </span>
                  </span>
                  {ev?.totalMark != null && (
                    <span className="font-mono text-sm text-ink">{ev.totalMark}/100</span>
                  )}
                  <SealDisc status={ev?.status ?? 'PENDING'} />
                </summary>

                <div className="border-t border-indigo-100 bg-white/50 p-5">
                  <form action={saveYearEvaluation} className="space-y-4">
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
                            defaultValue={(ev as any)?.[c.key] ?? 0}
                            className="field font-mono"
                          />
                          <p className="mt-0.5 text-right font-mono text-[10px] text-ink-muted">/{c.max}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button className="btn-outline">Save rubric</button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-indigo-100 pt-3">
                    {ev && ev.status === 'IN_REVIEW' && (
                      <form action={signoffYearEvaluation}>
                        <input type="hidden" name="studentId" value={s.id} />
                        <input type="hidden" name="academicYear" value={year} />
                        <button className="btn-seal">Sign off &amp; post 1 credit</button>
                      </form>
                    )}
                    {ev && ev.status === 'SIGNED_OFF' && user.role !== 'HOD' && (
                      <form action={exportYearEvaluation}>
                        <input type="hidden" name="studentId" value={s.id} />
                        <input type="hidden" name="academicYear" value={year} />
                        <button className="btn-primary">Export to exam cell</button>
                      </form>
                    )}
                    {ev?.examCellExportAt && (
                      <span className="self-center font-mono text-[11px] text-emerald-700">
                        Exported ✓
                      </span>
                    )}
                  </div>
                </div>
              </details>
            );
          })}
        </section>
      )}

      {/* Program-wise */}
      {user.role !== 'HOD' && students.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl text-ink">Program-wise · cumulated</h2>
          <div className="card divide-y divide-indigo-100 overflow-hidden">
            {students.map((s) => {
              const prog = progByStudent.get(s.id);
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{s.name}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                      {prog
                        ? `final ${prog.finalMark ?? '—'} · ${prog.creditTotal ?? 0} credits`
                        : 'not compiled'}
                    </span>
                  </span>
                  {prog && <SealDisc status={prog.status} />}
                  <form action={compileProgramEvaluation}>
                    <input type="hidden" name="studentId" value={s.id} />
                    <button className="btn-outline px-3 py-1.5 text-xs">Compile</button>
                  </form>
                  {prog && prog.status !== 'EXPORTED' && (
                    <form action={exportProgramEvaluation}>
                      <input type="hidden" name="studentId" value={s.id} />
                      <button className="btn-primary px-3 py-1.5 text-xs">Export</button>
                    </form>
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
