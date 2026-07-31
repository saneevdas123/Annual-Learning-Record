import { db } from '@/lib/db';
import { DELIVERABLE_LABEL } from '@/lib/labels';
import { submitIndustryAssessment } from '../../actions';
import { fmtDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function IndustryTokenPage({ params }: { params: { token: string } }) {
  const token = params.token;
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
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          Centurion University · External Assessment
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">Industry supervisor review</h1>
      </div>

      {invalid || !deliverable ? (
        <div className="card p-6 text-center">
          <h2 className="font-display text-lg text-ink">This link is not valid</h2>
          <p className="mt-1 text-sm text-ink-muted">
            The assessment link may have expired or already been used. Please contact the department for a new one.
          </p>
        </div>
      ) : rec?.usedAt ? (
        <div className="card p-6 text-center">
          <h2 className="font-display text-lg text-ink">Assessment received</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Thank you — your evaluation was submitted on {fmtDate(rec.usedAt)}.
          </p>
        </div>
      ) : (
        <div className="card p-6">
          <div className="mb-4">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              {DELIVERABLE_LABEL[deliverable.type] ?? deliverable.type} · {deliverable.academicYear}
            </span>
            <h2 className="mt-1 font-display text-xl text-ink">{deliverable.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Candidate{deliverable.candidates.length > 1 ? 's' : ''}:{' '}
              {deliverable.candidates.map((c) => c.user.name).join(', ') || '—'}
            </p>
          </div>

          <form action={submitIndustryAssessment} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="label">External score (out of 100)</label>
              <input name="externalScore" type="number" min="0" max="100" required className="field font-mono" />
              <p className="mt-1 text-[11px] text-ink-muted">
                This contributes the external 50% of the internship/deliverable assessment.
              </p>
            </div>
            <div>
              <label className="label">Feedback</label>
              <textarea name="feedback" className="field min-h-[110px] resize-y" placeholder="Your assessment of the candidate's work, conduct, and outcomes." />
            </div>
            <button className="btn-seal w-full">Submit assessment</button>
          </form>
          <p className="mt-3 text-center font-mono text-[10px] text-ink-muted">
            Secure tokenized link · no account required · expires {fmtDate(rec?.expiresAt)}
          </p>
        </div>
      )}
    </main>
  );
}
