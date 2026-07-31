import { requireUser } from '@/lib/session';
import { db } from '@/lib/db';
import { ROLE_LABELS } from '@/lib/domain';
import { PageHeader, Badge } from '@/components/ui';
import { initials, fmtDate } from '@/lib/utils';
import { acceptDeclaration, toggleMfa, updateProfile } from './actions';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      campus: { select: { name: true } },
      department: { select: { name: true } },
      program: { select: { name: true } },
      mentor: { select: { name: true } },
    },
  });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Account" title="Your profile" subtitle="Identity, declaration, and security." />

      <section className="card flex items-center gap-4 p-5">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full font-mono text-lg font-semibold text-white"
          style={{ background: user.avatarColor }}
        >
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl text-ink">{user.name}</h2>
          <p className="text-sm text-ink-muted">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="indigo">{ROLE_LABELS[user.role]}</Badge>
            {user.registrationNumber && <Badge tone="muted">{user.registrationNumber}</Badge>}
          </div>
        </div>
      </section>

      {/* E-declaration (finding z) */}
      <section className="card p-5">
        <h3 className="font-display text-base text-ink">Academic integrity declaration</h3>
        {user.eDeclarationAt ? (
          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Accepted on {fmtDate(user.eDeclarationAt)}. Thank you.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              I declare that all learning records I submit are my own work, that sources and collaborators are
              acknowledged, and that I accept the university&apos;s plagiarism and integrity policy.
            </p>
            <form action={acceptDeclaration} className="mt-3">
              <button className="btn-seal">Accept declaration</button>
            </form>
          </>
        )}
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* MFA (finding aa) */}
        <section className="card p-5">
          <h3 className="font-display text-base text-ink">Two-factor authentication</h3>
          <p className="mt-1 text-sm text-ink-muted">
            {user.mfaEnabled ? 'Enabled for your account.' : 'Optional additional login security.'}
          </p>
          <form action={toggleMfa} className="mt-3">
            <input type="hidden" name="enabled" value={(!user.mfaEnabled).toString()} />
            <button className={user.mfaEnabled ? 'btn-outline' : 'btn-primary'}>
              {user.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
            </button>
          </form>
        </section>

        <section className="card p-5">
          <h3 className="font-display text-base text-ink">Placement</h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <Row label="Campus" value={user.campus?.name ?? '—'} />
            <Row label="Department" value={user.department?.name ?? '—'} />
            <Row label="Program" value={user.program?.name ?? '—'} />
            {user.role === 'STUDENT' && <Row label="Mentor" value={user.mentor?.name ?? '—'} />}
          </dl>
        </section>
      </div>

      <section className="card p-5">
        <h3 className="font-display text-base text-ink">About</h3>
        <form action={updateProfile} className="mt-2 space-y-3">
          <textarea
            name="bio"
            defaultValue={user.bio ?? ''}
            className="field min-h-[90px] resize-y"
            placeholder="A short note about your focus areas."
          />
          <div className="flex justify-end">
            <button className="btn-outline">Save</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
