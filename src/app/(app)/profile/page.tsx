import { requireUser } from '@/lib/session';
import { db } from '@/lib/db';
import { ROLE_LABELS } from '@/lib/domain';
import { PageHead, Badge } from '@/components/ui';
import { initials, fmtDate } from '@/lib/utils';
import { acceptDeclaration, updateProfile } from './actions';
import { changePasswordFromProfile } from '@/app/(app)/account/actions';
import { ActionForm } from '@/components/ActionForm';
import { PasswordField } from '@/components/PasswordField';
import { AppTabs } from '@/components/AppTabs';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === 'security' ? 'security' : 'profile';
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
      <PageHead eyebrow="Account" title="Your profile" subtitle="Identity, declaration, and placement." />

      <AppTabs
        active={tab}
        tabs={[
          { key: 'profile', label: 'Profile', href: '/profile' },
          { key: 'security', label: 'Security', href: '/profile?tab=security' },
        ]}
      />

      {tab === 'profile' && (
      <div className="space-y-6">
      <section className="card flex items-center gap-4 p-5">
        <span className="shell-avatar !h-16 !w-16 text-lg">{initials(user.name)}</span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-ink">{user.name}</h2>
          <p className="text-sm text-ink/55">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="brand">{ROLE_LABELS[user.role]}</Badge>
            {user.registrationNumber && <Badge tone="muted">{user.registrationNumber}</Badge>}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-bold text-ink">Academic integrity declaration</h3>
        {user.eDeclarationAt ? (
          <p className="ui-callout-ok mt-2 px-3 py-2 text-sm">
            Accepted on {fmtDate(user.eDeclarationAt)}. Thank you.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink/65">
              I declare that all learning records I submit are my own work, that sources and collaborators are
              acknowledged, and that I accept the university&apos;s plagiarism and integrity policy.
            </p>
            <ActionForm action={acceptDeclaration} success="Declaration accepted." className="mt-3">
              <button className="btn-primary">Accept declaration</button>
            </ActionForm>
          </>
        )}
      </section>

      <section className="card p-5">
        <h3 className="font-bold text-ink">Placement</h3>
        <dl className="mt-2 space-y-1.5 text-sm">
          <Row label="Campus" value={user.campus?.name ?? '—'} />
          <Row label="Department" value={user.department?.name ?? '—'} />
          <Row label="Program" value={user.program?.name ?? '—'} />
          {user.role === 'STUDENT' && <Row label="Mentor" value={user.mentor?.name ?? '—'} />}
        </dl>
      </section>

      <section className="card p-5">
        <h3 className="font-bold text-ink">About</h3>
        <ActionForm action={updateProfile} success="Profile saved." className="mt-2 space-y-3">
          <textarea
            name="bio"
            defaultValue={user.bio ?? ''}
            className="input"
            placeholder="A short note about your focus areas."
          />
          <div className="flex justify-end">
            <button className="btn-ghost">Save</button>
          </div>
        </ActionForm>
      </section>
      </div>
      )}

      {tab === 'security' && (
      <section className="card p-5">
        <h3 className="font-bold text-ink">Change password</h3>
        <p className="mt-1 text-sm text-ink/55">At least 8 characters. You will stay signed in.</p>
        <ActionForm action={changePasswordFromProfile} success="Password updated." className="mt-3 space-y-3">
          <PasswordField
            id="profile-current"
            name="currentPassword"
            label="Current password"
            required
            autoComplete="current-password"
          />
          <PasswordField
            id="profile-new"
            name="newPassword"
            label="New password"
            required
            autoComplete="new-password"
          />
          <PasswordField
            id="profile-confirm"
            name="confirmPassword"
            label="Confirm new password"
            required
            autoComplete="new-password"
          />
          <div className="flex justify-end">
            <button className="btn-primary">Update password</button>
          </div>
        </ActionForm>
      </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/45">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
