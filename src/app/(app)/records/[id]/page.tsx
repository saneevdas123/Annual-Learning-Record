import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { db } from '@/lib/db';
import { RECORD_TYPES, ROLE_LABELS, type RecordType } from '@/lib/domain';
import { aiEnabled } from '@/lib/env';
import { SealDisc, Badge, PageHeader, Progress } from '@/components/ui';
import { fmtDate } from '@/lib/utils';
import {
  addEntry,
  submitRecord,
  requestAiScore,
  reviewRecord,
  fileAppeal,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function RecordDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const record = await db.learningRecord.findUnique({
    where: { id: params.id },
    include: {
      course: { include: { faculty: { select: { name: true } } } },
      student: { select: { id: true, name: true, registrationNumber: true, mentorId: true } },
      entries: { orderBy: { createdAt: 'asc' } },
      appeals: { orderBy: { createdAt: 'desc' } },
      reviewedBy: { select: { name: true, role: true } },
    },
  });
  if (!record) notFound();

  const steps = await db.signoffStep.findMany({
    where: { target: 'LEARNING_RECORD', targetId: record.id },
    orderBy: { stepOrder: 'asc' },
    include: { signer: { select: { name: true } } },
  });

  const spec = RECORD_TYPES[record.recordType as RecordType];
  const isOwner = user.id === record.student.id;
  const isReviewer =
    !isOwner && ['FACULTY', 'MENTOR', 'HOD', 'DEAN'].includes(user.role);
  const locked = ['APPROVED', 'REJECTED'].includes(record.status);
  const canEdit = isOwner && !locked;

  const entryAvg =
    record.entries.length > 0
      ? record.entries.reduce((s, e) => s + (e.rawScore ?? 0), 0) / record.entries.length
      : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={isOwner ? '/records' : '/review'} className="text-sm text-ink-muted hover:text-ink">
        ← Back
      </Link>

      <PageHeader
        eyebrow={`${record.course.code} · ${spec.label}`}
        title={record.title}
        subtitle={`${record.academicYear} · ${record.term} · weight ${spec.weightPct}%`}
        action={<SealDisc status={record.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overview */}
          <section className="card p-5">
            <h2 className="font-display text-lg text-ink">Overview</h2>
            {record.description ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{record.description}</p>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">No description provided.</p>
            )}
            {record.booksReferred && (
              <p className="mt-3 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs text-ink-soft">
                <span className="font-mono uppercase tracking-wide text-ink-muted">Books / manuals</span>
                <br />
                {record.booksReferred}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="muted">Scale /{spec.perEntryMax} per entry</Badge>
              <Badge tone="brass">Subject weight {spec.weightPct}%</Badge>
              {record.student.registrationNumber && (
                <Badge tone="indigo">{record.student.registrationNumber}</Badge>
              )}
            </div>
            <p className="mt-3 rounded-lg border border-brass-100 bg-brass-50 px-3 py-2 text-xs text-brass-600">
              Normalization: {spec.normalization}
            </p>
          </section>

          {/* Entries */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ink">
                {spec.entryBased ? 'Experiments / tasks' : 'Assessment components'}
              </h2>
              <span className="font-mono text-xs text-ink-muted">
                {record.entries.length} · avg {entryAvg.toFixed(1)}/{spec.perEntryMax}
              </span>
            </div>

            {record.entries.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                No entries recorded yet{canEdit ? ' — add the first below.' : '.'}
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {record.entries.map((e, i) => {
                  const rubric = (e.rubricScores as Record<string, number> | null) ?? {};
                  return (
                    <li key={e.id} className="rounded-lg border border-indigo-100 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">
                          {String(i + 1).padStart(2, '0')} · {e.title}
                        </span>
                        <span className="font-mono text-sm text-ink">
                          {e.rawScore ?? 0}
                          <span className="text-ink-muted">/{e.maxScore}</span>
                        </span>
                      </div>
                      {e.content && <p className="mt-1 text-xs text-ink-soft">{e.content}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(rubric).map(([k, v]) => (
                          <span
                            key={k}
                            className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted"
                          >
                            {k}: {v}
                          </span>
                        ))}
                        {e.hoursLogged != null && (
                          <span className="rounded border border-brass-100 bg-brass-50 px-1.5 py-0.5 font-mono text-[10px] text-brass-600">
                            {e.hoursLogged}h
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {canEdit && (
              <form action={addEntry} className="mt-4 space-y-3 border-t border-indigo-100 pt-4">
                <input type="hidden" name="recordId" value={record.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Entry title</label>
                    <input
                      name="entryTitle"
                      required
                      className="field"
                      placeholder={spec.entryBased ? 'e.g. Experiment 3' : 'e.g. Assessment'}
                    />
                  </div>
                  {spec.hoursBased && (
                    <div>
                      <label className="label">Hours logged</label>
                      <input name="hours" type="number" min="0" step="0.5" className="field" placeholder="0" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea name="entryContent" className="field min-h-[70px] resize-y" placeholder="What was done, observed, concluded." />
                </div>
                <div>
                  <p className="label">Rubric ({spec.perEntryMax} total)</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {spec.rubric.map((c) => (
                      <label key={c.criterion} className="flex items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-1.5">
                        <span className="text-xs text-ink-soft">{c.criterion}</span>
                        <input
                          name={`rubric_${c.criterion}`}
                          type="number"
                          min="0"
                          max={c.max}
                          defaultValue={0}
                          className="w-16 rounded border border-indigo-200 px-2 py-1 text-right font-mono text-sm"
                        />
                        <span className="font-mono text-[10px] text-ink-muted">/{c.max}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="btn-outline">Add entry</button>
                </div>
              </form>
            )}
          </section>

          {/* AI + faculty review */}
          {(record.aiSummary || isReviewer) && (
            <section className="card p-5">
              <h2 className="font-display text-lg text-ink">Evaluation</h2>

              {record.aiSummary && (
                <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3">
                  <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-indigo-700">
                    AI advisory · score {record.aiScore}/{spec.perEntryMax}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{record.aiSummary}</p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    Advisory only — the faculty score below is authoritative and always overrides AI.
                  </p>
                </div>
              )}

              {isReviewer && !locked && (
                <div className="mt-4 space-y-4">
                  {aiEnabled && !record.aiSummary && (
                    <form action={requestAiScore}>
                      <input type="hidden" name="recordId" value={record.id} />
                      <button className="btn-ghost text-xs">Request AI advisory score</button>
                    </form>
                  )}

                  <form action={reviewRecord} className="space-y-3 border-t border-indigo-100 pt-4">
                    <input type="hidden" name="recordId" value={record.id} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Final score (out of {spec.perEntryMax})</label>
                        <input
                          name="facultyScore"
                          type="number"
                          min="0"
                          max={spec.perEntryMax}
                          step="0.5"
                          required
                          defaultValue={record.facultyScore ?? Math.round(entryAvg)}
                          className="field font-mono"
                        />
                        <p className="mt-1 text-[11px] text-ink-muted">
                          Normalizes to {spec.weightPct}% of the subject.
                        </p>
                      </div>
                      <div>
                        <label className="label">Decision</label>
                        <select name="decision" className="field" defaultValue="APPROVED">
                          <option value="APPROVED">Approve &amp; sign off</option>
                          <option value="REVISION">Return for revision</option>
                          <option value="REJECTED">Reject</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">Reviewer note</label>
                      <textarea name="mentorNote" className="field min-h-[60px] resize-y" placeholder="Optional feedback for the student." defaultValue={record.mentorNote ?? ''} />
                    </div>
                    <div className="flex justify-end">
                      <button className="btn-seal">Record decision</button>
                    </div>
                  </form>
                </div>
              )}

              {record.facultyScore != null && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-emerald-700">
                    Final score {record.facultyScore}/{spec.perEntryMax}
                    {record.reviewedBy && ` · by ${record.reviewedBy.name}`}
                  </p>
                  {record.normalizedScore != null && (
                    <p className="mt-1 text-sm text-ink">
                      Normalized: <span className="font-mono">{record.normalizedScore}</span> of {record.subjectWeightPct}% subject weight
                    </p>
                  )}
                  {record.normalizationNote && (
                    <p className="mt-1 font-mono text-[11px] text-ink-muted">{record.normalizationNote}</p>
                  )}
                  {record.mentorNote && <p className="mt-2 text-sm text-ink-soft">“{record.mentorNote}”</p>}
                </div>
              )}
            </section>
          )}

          {/* Appeal (finding r) */}
          {isOwner && record.reviewedById && (
            <section className="card p-5">
              <h2 className="font-display text-lg text-ink">Appeal the score</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Disagree with the evaluation? File an appeal — it is logged and resolved by a human reviewer.
              </p>
              {record.appeals.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {record.appeals.map((a) => (
                    <li key={a.id} className="rounded-lg border border-indigo-100 bg-white p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-soft">{a.reason}</span>
                        <SealDisc status={a.status} />
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-ink-muted">{fmtDate(a.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
              {record.appeals.every((a) => a.status !== 'OPEN') && (
                <form action={fileAppeal} className="mt-3 space-y-3">
                  <input type="hidden" name="recordId" value={record.id} />
                  <textarea name="reason" required className="field min-h-[70px] resize-y" placeholder="Explain why you believe the score should be reviewed." />
                  <div className="flex justify-end">
                    <button className="btn-outline">Submit appeal</button>
                  </div>
                </form>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submit */}
          {isOwner && ['DRAFT', 'REVISION'].includes(record.status) && (
            <section className="card p-5">
              <h3 className="font-display text-base text-ink">Ready to submit?</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Submitting opens the sign-off chain: faculty, then mentor, then HoD.
              </p>
              <form action={submitRecord} className="mt-3">
                <input type="hidden" name="recordId" value={record.id} />
                <button className="btn-primary w-full">Submit for review</button>
              </form>
            </section>
          )}

          {/* Score summary */}
          <section className="card p-5">
            <h3 className="font-display text-base text-ink">Subject contribution</h3>
            <div className="mt-3">
              <div className="flex items-end justify-between">
                <span className="font-mono text-3xl font-semibold text-ink">
                  {record.normalizedScore ?? '—'}
                </span>
                <span className="font-mono text-sm text-ink-muted">/ {spec.weightPct}%</span>
              </div>
              <div className="mt-2">
                <Progress value={record.normalizedScore ?? 0} max={spec.weightPct} />
              </div>
            </div>
          </section>

          {/* Sign-off chain (finding h) */}
          <section className="card p-5">
            <h3 className="font-display text-base text-ink">Sign-off chain</h3>
            {steps.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">Opens once the record is submitted.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {steps.map((s) => (
                  <li key={s.id} className="flex items-start gap-3">
                    <span
                      className={
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] ' +
                        (s.status === 'SIGNED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-indigo-100 text-ink-muted')
                      }
                    >
                      {s.stepOrder}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">
                        {ROLE_LABELS[s.role] ?? s.role}
                      </span>
                      <span className="block font-mono text-[11px] text-ink-muted">
                        {s.status === 'SIGNED'
                          ? `Signed by ${s.signer?.name ?? '—'} · ${fmtDate(s.signedAt)}`
                          : 'Pending'}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card p-5">
            <h3 className="font-display text-base text-ink">Details</h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Student</dt>
                <dd className="text-ink">{record.student.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Faculty</dt>
                <dd className="text-ink">{record.course.faculty.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Submitted</dt>
                <dd className="text-ink">{fmtDate(record.submittedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Reviewed</dt>
                <dd className="text-ink">{fmtDate(record.reviewedAt)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
