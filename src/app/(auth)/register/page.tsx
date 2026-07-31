'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { registerAction } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Creating…' : 'Create account'}
    </button>
  );
}

export default function RegisterPage() {
  const [state, action] = useFormState(registerAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-800 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M6 4h9a3 3 0 0 1 3 3v13H9a3 3 0 0 1-3-3V4Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M9 8.5h6M9 12h6M9 15.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-brass-400" />
            </svg>
          </span>
          <span className="font-display text-lg text-ink">ALR</span>
        </div>

        <p className="eyebrow">Get started</p>
        <h2 className="mt-1 font-display text-3xl text-ink">Create your account</h2>
        <p className="mt-2 text-sm text-ink-muted">
          The first account created becomes the administrator.
        </p>

        <form action={action} className="card mt-7 space-y-4 p-6">
          <div>
            <label className="label">Full name</label>
            <input name="name" required className="field" />
          </div>
          <div>
            <label className="label">University email</label>
            <input name="email" type="email" required className="field" placeholder="you@cutm.ac.in" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" required minLength={8} className="field" />
            </div>
            <div>
              <label className="label">I am a</label>
              <select name="role" className="field">
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
                <option value="MENTOR">Mentor</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Registration number (optional)</label>
            <input name="registrationNumber" className="field" placeholder="e.g. 210101120001" />
          </div>
          {state?.error && (
            <p className="rounded-lg border border-seal-100 bg-seal-50 px-3 py-2 text-sm text-seal-600">
              {state.error}
            </p>
          )}
          <SubmitButton />
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
