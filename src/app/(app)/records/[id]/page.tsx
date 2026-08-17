import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { db } from '@/lib/db';
import { RECORD_TYPES, ROLE_LABELS, type RecordType } from '@/lib/domain';
import { aiEnabled } from '@/lib/env';
import { SealDisc, Badge, PageHead, Progress } from '@/components/ui';
import { fmtDate } from '@/lib/utils';
import { canActOnStep, canReviewRecord, canViewRecord, currentSignoffStep } from '@/lib/access';
import {
  addEntry,
  submitRecord,
  requestAiScore,
  reviewRecord,
  fileAppeal,
  resolveAppeal,
} from '../actions';
import { ActionForm } from '@/components/ActionForm';
import { AppTabs } from '@/components/AppTabs';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const record = await db.learningRecord.findUnique({
    where: { id },
    select: { title: true, description: true, course: { select: { code: true } } },
  });
  if (!record) {
    return pageMeta({ title: 'Learning record', description: 'A student learning record.', path: `/records/${id}` });
  }
  return pageMeta({
    title: record.title,
    description: record.description?.slice(0, 160) || `${record.course.code} learning record on the CUTM ALR.`,
    path: `/records/${id}`,
  });
}

export default async function RecordDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { tab: rawTab } = await searchParams;

  const record = await db.learningRecord.findUnique({
    where: { id },
    include: {
      course: { include: { faculty: { select: { name: true, id: true } } } },
      student: {
        select: { id: true, name: true, registrationNumber: true, mentorId: true, departmentId: true, campusId: true },
      },
      entries: { orderBy: { createdAt: 'asc' } },
      appeals: { orderBy: { createdAt: 'desc' } },
      reviewedBy: { select: { name: true, role: true } },
    },
  });
  if (!record) notFound();
  if (!canViewRecord(user, record)) notFound();

  const steps = await db.signoffStep.findMany({
    where: { target: 'LEARNING_RECORD', targetId: record.id },
    orderBy: { stepOrder: 'asc' },
    include: { signer: { select: { name: true } } },
  });

  const spec = RECORD_TYPES[record.recordType as RecordType];
  const isOwner = user.id === record.student.id;
  const assigned = canReviewRecord(user, record);
  const step = await currentSignoffStep(record.id);
  const canDecide = assigned && !!step && canActOnStep(user, step.role);
  const locked = ['APPROVED', 'REJECTED'].includes(record.status);
  const canEdit = isOwner && ['DRAFT', 'REVISION'].includes(record.status);

  const entryAvg =
    record.entries.length > 0
      ? record.entries.reduce((s, e) => s + (e.rawScore ?? 0), 0) / record.entries.length
      : 0;

  const openAppeals = record.appeals.filter((a) => a.status === 'OPEN');
  const showReview = assigned || record.facultyScore != null;
  const showAppeals = record.appeals.length > 0 || (isOwner && !!record.reviewedById);
  const tab =
    rawTab === 'review' && showReview
      ? 'review'
      : rawTab === 'appeals' && showAppeals
        ? 'appeals'
        : 'record';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={isOwner ? '/records' : '/review'}
        className="text-sm font-semibold text-ink/55 hover:text-ink"
      >
        ← Back
      </Link>

      <PageHead
        eyebrow={`${record.course.code} · ${spec.label}`}
        title={record.title}
        subtitle={`${record.academicYear} · ${record.term} · weight ${spec.weightPct}%`}
        action={<SealDisc status={record.status} />}
      />

      {(showReview || showAppeals) && (
        <AppTabs
          active={tab}
          tabs={[
            { key: 'record', label: 'Record', href: `/records/${record.id}` },
            ...(showReview
              ? [{ key: 'review', label: 'Review', href: `/records/${record.id}?tab=review` }]
              : []),
            ...(showAppeals
              ? [
                  {
                    key: 'appeals',
                    label: 'Appeals',
                    href: `/records/${record.id}?tab=appeals`,
                    count: record.appeals.length,
                  },
                ]
              : []),
          ]}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {tab === 'record' && (
          <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-lg font-bold text-ink">Overview</h2>
            {record.description ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">{record.description}</p>
            ) : (
              <p className="mt-2 text-sm text-ink/45">No description provided.</p>
            )}
            {record.booksReferred && (
              <p className="ui-nest mt-3 px-3 py-2 text-xs text-ink/70">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-ink/40">Books / manuals</span>
                {record.booksReferred}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="muted">Scale /{spec.perEntryMax} per entry</Badge>
              <Badge tone="amber">Subject weight {spec.weightPct}%</Badge>
              {record.student.registrationNumber && (
                <Badge tone="blue">{record.student.registrationNumber}</Badge>
              )}
            </div>
            <p className="ui-callout-soft mt-3 px-3 py-2 text-xs">Normalization: {spec.normalization}</p>
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">
                {spec.entryBased ? 'Experiments / tasks' : 'Assessment components'}
              </h2>
              <span className="text-xs font-semibold text-ink/45">
                {record.entries.length} · avg {entryAvg.toFixed(1)}/{spec.perEntryMax}
              </span>
            </div>

            {record.entries.length === 0 ? (
              <p className="mt-3 text-sm text-ink/45">
                No entries recorded yet{canEdit ? ' — add the first below.' : '.'}
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {record.entries.map((e, i) => {
                  const rubric = (e.rubricScores as Record<string, number> | null) ?? {};
                  return (
                    <li key={e.id} className="ui-nest p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">
                          {String(i + 1).padStart(2, '0')} · {e.title}
                        </span>
                        <span className="text-sm font-bold text-ink">
                          {e.rawScore ?? 0}
                          <span className="text-ink/45">/{e.maxScore}</span>
                        </span>
                      </div>
                      {e.content && <p className="mt-1 text-xs text-ink/60">{e.content}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(rubric).map(([k, v]) => (
                          <span key={k} className="badge">
                            {k}: {v}
                          </span>
                        ))}
                        {e.hoursLogged != null && <Badge tone="amber">{e.hoursLogged}h</Badge>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {canEdit && (
              <ActionForm action={addEntry} success="Entry saved." className="mt-4 space-y-3 border-t border-ink/10 pt-4">
                <input type="hidden" name="recordId" value={record.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Entry title</label>
                    <input
                      name="entryTitle"
                      required
                      className="input"
                      placeholder={spec.entryBased ? 'e.g. Experiment 3' : 'e.g. Assessment'}
                    />
                  </div>
                  {spec.hoursBased && (
                    <div>
                      <label className="label">Hours logged</label>
                      <input name="hours" type="number" min="0" step="0.5" className="input" placeholder="0" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea name="entryContent" className="input" placeholder="What was done, observed, concluded." />
                </div>
                <div>
                  <p className="label">Rubric ({spec.perEntryMax} total)</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {spec.rubric.map((c) => (
                      <label key={c.criterion} className="ui-nest flex items-center justify-between gap-2 px-3 py-1.5">
                        <span className="text-xs text-ink/70">{c.criterion}</span>
                        <input
                          name={`rubric_${c.criterion}`}
                          type="number"
                          min="0"
                          max={c.max}
                          defaultValue={0}
                          className="input !w-16 !px-2 !py-1 text-right"
                        />
                        <span className="text-[10px] font-bold text-ink/40">/{c.max}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary">Add entry</button>
                </div>
              </ActionForm>
            )}
          </section>
          </div>
          )}

          {tab === 'review' && (
            <section className="card p-5">
              <h2 className="text-lg font-bold text-ink">Evaluation</h2>

              {record.aiSummary && (
                <div className="ui-callout mt-3 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink/55">
                    AI advisory · score {record.aiScore}/{spec.perEntryMax}
                    {record.aiModel ? ` · ${record.aiModel}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-ink/70">{record.aiSummary}</p>
                  <p className="mt-1 text-[11px] text-ink/45">
                    Three-agent pass (evidence → rubric → critic). Advisory only — faculty always overrides.
                  </p>
                </div>
              )}

              {canDecide && !locked && (
                <div className="mt-4 space-y-4">
                  {step && (
                    <p className="text-xs font-semibold text-ink/50">
                      Current step: {ROLE_LABELS[step.role] ?? step.role}
                    </p>
                  )}
                  {aiEnabled && (
                    <ActionForm action={requestAiScore} success="Advisory score ready.">
                      <input type="hidden" name="recordId" value={record.id} />
                      <button className="btn-ghost text-xs">
                        {record.aiSummary ? 'Re-run advisory score' : 'Request AI advisory score'}
                      </button>
                    </ActionForm>
                  )}

                  <ActionForm action={reviewRecord} success="Review saved." className="space-y-3 border-t border-ink/10 pt-4">
                    <input type="hidden" name="recordId" value={record.id} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {step?.role === 'FACULTY' && (
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
                            className="input"
                          />
                          <p className="ui-field-hint">Normalizes to {spec.weightPct}% of the subject.</p>
                        </div>
                      )}
                      <div>
                        <label className="label">Decision</label>
                        <select name="decision" className="input" defaultValue="APPROVED">
                          <option value="APPROVED">
                            {step?.role === 'HOD' || step?.role === 'DEAN' ? 'Approve & sign off' : 'Approve & advance'}
                          </option>
                          <option value="REVISION">Return for revision</option>
                          <option value="REJECTED">Reject</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">Reviewer note</label>
                      <textarea
                        name="mentorNote"
                        className="input"
                        placeholder="Optional feedback for the student."
                        defaultValue={record.mentorNote ?? ''}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button className="btn-primary">Record decision</button>
                    </div>
                  </ActionForm>
                </div>
              )}

              {assigned && !canDecide && !locked && (
                <p className="mt-3 text-sm text-ink/50">Waiting for the current sign-off step before you can act.</p>
              )}

              {record.facultyScore != null && (
                <div className="ui-callout-ok mt-4 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide">
                    Final score {record.facultyScore}/{spec.perEntryMax}
                    {record.reviewedBy && ` · by ${record.reviewedBy.name}`}
                  </p>
                  {record.normalizedScore != null && (
                    <p className="mt-1 text-sm text-ink">
                      Normalized: <span className="font-bold">{record.normalizedScore}</span> of{' '}
                      {record.subjectWeightPct}% subject weight
                    </p>
                  )}
                  {record.normalizationNote && (
                    <p className="mt-1 text-[11px] text-ink/50">{record.normalizationNote}</p>
                  )}
                  {record.mentorNote && <p className="mt-2 text-sm text-ink/70">“{record.mentorNote}”</p>}
                </div>
              )}
            </section>
          )}

          {tab === 'appeals' && (
          <div className="space-y-6">
          {openAppeals.length > 0 && assigned && (
            <section className="card p-5">
              <h2 className="text-lg font-bold text-ink">Open appeal</h2>
              {openAppeals.map((a) => (
                <ActionForm key={a.id} action={resolveAppeal} success="Appeal resolved." className="mt-3 space-y-3">
                  <input type="hidden" name="appealId" value={a.id} />
                  <p className="ui-nest p-3 text-sm text-ink/70">{a.reason}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">Decision</label>
                      <select name="decision" className="input" defaultValue="DENIED">
                        <option value="UPHELD">Uphold (change score)</option>
                        <option value="DENIED">Deny</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">New score</label>
                      <input name="newScore" type="number" min="0" max={spec.perEntryMax} step="0.5" className="input" />
                    </div>
                  </div>
                  <textarea name="facultyOverrideReason" className="input" placeholder="Resolution note" />
                  <div className="flex justify-end">
                    <button className="btn-primary">Resolve appeal</button>
                  </div>
                </ActionForm>
              ))}
            </section>
          )}

          {isOwner && record.reviewedById && (
            <section className="card p-5">
              <h2 className="text-lg font-bold text-ink">Appeal the score</h2>
              <p className="mt-1 text-sm text-ink/55">
                Disagree with the evaluation? File an appeal — it is logged and resolved by a human reviewer.
              </p>
              {record.appeals.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {record.appeals.map((a) => (
                    <li key={a.id} className="ui-nest p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-ink/70">{a.reason}</span>
                        <SealDisc status={a.status} />
                      </div>
                      <p className="mt-1 text-[10px] font-semibold text-ink/40">{fmtDate(a.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
              {record.appeals.every((a) => a.status !== 'OPEN') && (
                <ActionForm action={fileAppeal} success="Appeal filed." className="mt-3 space-y-3">
                  <input type="hidden" name="recordId" value={record.id} />
                  <textarea
                    name="reason"
                    required
                    className="input"
                    placeholder="Explain why you believe the score should be reviewed."
                  />
                  <div className="flex justify-end">
                    <button className="btn-ghost">Submit appeal</button>
                  </div>
                </ActionForm>
              )}
            </section>
          )}
          </div>
          )}
        </div>

        <div className="space-y-6">
          {isOwner && ['DRAFT', 'REVISION'].includes(record.status) && (
            <section className="card p-5">
              <h3 className="font-bold text-ink">Ready to submit?</h3>
              <p className="mt-1 text-sm text-ink/55">
                Submitting opens the sign-off chain: faculty, then mentor, then HoD.
              </p>
              {!user.eDeclarationAt && (
                <p className="ui-callout-warn mt-3 p-3 text-xs">
                  Accept the declaration on your profile first.
                </p>
              )}
              <ActionForm action={submitRecord} success="Submitted for review." className="mt-3">
                <input type="hidden" name="recordId" value={record.id} />
                <button className="btn-primary w-full" disabled={!user.eDeclarationAt}>
                  Submit for review
                </button>
              </ActionForm>
            </section>
          )}

          <section className="card p-5">
            <h3 className="font-bold text-ink">Subject contribution</h3>
            <div className="mt-3">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-ink">{record.normalizedScore ?? '—'}</span>
                <span className="text-sm text-ink/45">/ {spec.weightPct}%</span>
              </div>
              <div className="mt-2">
                <Progress value={record.normalizedScore ?? 0} max={spec.weightPct} />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="font-bold text-ink">Sign-off chain</h3>
            {steps.length === 0 ? (
              <p className="mt-2 text-sm text-ink/45">Opens once the record is submitted.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {steps.map((s) => (
                  <li key={s.id} className="flex items-start gap-3">
                    <span
                      className={
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ' +
                        (s.status === 'SIGNED' ? 'bg-accent-mint text-ink' : 'bg-ink/8 text-ink/50')
                      }
                    >
                      {s.stepOrder}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{ROLE_LABELS[s.role] ?? s.role}</span>
                      <span className="block text-[11px] text-ink/45">
                        {s.status === 'SIGNED'
                          ? `Signed by ${s.signer?.name ?? '—'} · ${fmtDate(s.signedAt)}`
                          : s.status === 'PENDING'
                            ? 'Pending'
                            : s.status}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card p-5">
            <h3 className="font-bold text-ink">Details</h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink/45">Student</dt>
                <dd className="text-ink">{record.student.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink/45">Faculty</dt>
                <dd className="text-ink">{record.course.faculty.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink/45">Submitted</dt>
                <dd className="text-ink">{fmtDate(record.submittedAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink/45">Reviewed</dt>
                <dd className="text-ink">{fmtDate(record.reviewedAt)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
