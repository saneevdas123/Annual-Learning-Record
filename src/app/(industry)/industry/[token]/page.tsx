import { db } from '@/lib/db';
import { DELIVERABLE_LABEL } from '@/lib/labels';
import { submitIndustryAssessment } from '../../actions';
import { fmtDate } from '@/lib/utils';
import { CutmMark } from '@/components/CutmMark';
import { ActionForm } from '@/components/ActionForm';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMeta({
  title: 'Industry supervisor review',
  description: 'Tokenised external assessment of a student internship or industry deliverable.',
  path: '/industry',
});

export default async function IndustryTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rec = await db.industryToken.findUnique({ where: { token } });

  const invalid = !rec || rec.expiresAt < new Date();
  const deliverable = rec
    ? await db.deliverable.findUnique({
        where: { id: rec.deliverableId },
        include: {
          candidates: { include: { user: { select: { name: true } } } },
        },
      })
    : null;

  return (
    <main className="min-h-screen bg-cream text-ink px-4 py-12">
      <div className="mx-auto flex max-w-xl flex-col">
        <div className="mb-6 text-center">
          <CutmMark variant="stack" href="/" title="ALR" subtitle="Centurion University" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-ink/45">
            External Assessment
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Industry supervisor review</h1>
        </div>

        {invalid || !deliverable ? (
          <div className="card p-6 text-center">
            <h2 className="text-lg font-bold text-ink">This link is not valid</h2>
            <p className="mt-1 text-sm text-ink/55">
              The assessment link may have expired or already been used. Please contact the department for a new one.
            </p>
          </div>
        ) : rec?.usedAt ? (
          <div className="card p-6 text-center">
            <h2 className="text-lg font-bold text-ink">Assessment received</h2>
            <p className="mt-1 text-sm text-ink/55">
              Thank you — your evaluation was submitted on {fmtDate(rec.usedAt)}.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-ink/10">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                {DELIVERABLE_LABEL[deliverable.type] ?? deliverable.type} · {deliverable.academicYear}
              </span>
              <h2 className="mt-1 text-xl font-bold text-ink">{deliverable.title}</h2>
              <p className="mt-1 text-sm text-ink/55">
                Candidate{deliverable.candidates.length > 1 ? 's' : ''}:{' '}
                {deliverable.candidates.map((c) => c.user.name).join(', ') || '—'}
              </p>
            </div>
            <ActionForm action={submitIndustryAssessment} success="Assessment submitted." className="p-5 space-y-4">
              <input type="hidden" name="token" value={token} />
              <div>
                <label className="label">External score (out of 100)</label>
                <input name="externalScore" type="number" min="0" max="100" required className="input" />
                <p className="ui-field-hint">This contributes the external 50% of the internship/deliverable assessment.</p>
              </div>
              <div>
                <label className="label">Feedback</label>
                <textarea
                  name="feedback"
                  className="input"
                  placeholder="Your assessment of the candidate's work, conduct, and outcomes."
                />
              </div>
              <button className="btn-primary w-full">Submit assessment</button>
            </ActionForm>
            <p className="px-5 pb-4 text-center text-[10px] font-semibold uppercase tracking-wide text-ink/40">
              Secure tokenized link · no account required · expires {fmtDate(rec?.expiresAt)}
            </p>
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <CutmMark variant="compact" href="/" title="ALR" subtitle="CUTM" />
        </div>
      </div>
    </main>
  );
}
