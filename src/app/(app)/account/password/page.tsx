'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { changePassword } from '../actions';
import { PasswordField } from '@/components/PasswordField';
import { CutmMark } from '@/components/CutmMark';
import type { ActionResult } from '@/lib/action-result';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full !py-3" disabled={pending}>
      {pending ? 'Saving…' : 'Save new password'}
    </button>
  );
}

async function action(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await changePassword(formData);
    return undefined;
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e;
    return { error: e instanceof Error ? e.message : 'Could not change password.' };
  }
}

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-5 flex justify-center">
        <CutmMark variant="stack" href="/" title="ALR" subtitle="Centurion University" />
      </div>
      <div className={`login-board${pending ? ' is-loading' : ''}`}>
        <div className="login-board-inner">
          <p className="text-brand font-semibold italic text-sm mb-1">First sign-in</p>
          <h1 className="text-2xl font-bold text-ink">Choose your password</h1>
          <p className="mt-1.5 text-sm text-ink/55">
            The temporary password was emailed to you. Pick a password only you know — at least 8 characters.
          </p>
          {state?.error ? (
            <div className="mt-4 text-sm text-ink ui-callout-danger px-3 py-2">{state.error}</div>
          ) : null}
          <form action={formAction} className="mt-5 space-y-4">
            <PasswordField
              id="current-password"
              name="currentPassword"
              label="Current / temporary password"
              required
              autoComplete="current-password"
            />
            <PasswordField
              id="new-password"
              name="newPassword"
              label="New password"
              required
              autoComplete="new-password"
            />
            <PasswordField
              id="confirm-password"
              name="confirmPassword"
              label="Confirm new password"
              required
              autoComplete="new-password"
            />
            <Submit />
          </form>
        </div>
      </div>
    </div>
  );
}
