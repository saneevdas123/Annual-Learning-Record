'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '../actions';

const LEDGER_ROWS = [
  { i: '01', t: 'Record of Classroom Learning', s: 'Approved', c: 'text-emerald-300' },
  { i: '02', t: 'Applied & Action Learning', s: 'Under review', c: 'text-indigo-200' },
  { i: '03', t: 'Project Report', s: 'Signed off', c: 'text-emerald-300' },
  { i: '04', t: 'Internship Report', s: 'Needs revision', c: 'text-brass-400' },
  { i: '05', t: 'Annual compilation', s: '1 credit posted', c: 'text-brass-400' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState(loginAction, undefined);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Signature ledger panel */}
      <div className="relative hidden overflow-hidden bg-indigo-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, transparent 0 43px, #fff 43px 44px)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <LedgerMark />
          <div className="leading-tight">
            <p className="font-display text-xl">ALR</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-200">
              Annual Learning Record
            </p>
          </div>
        </div>

        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass-400">
            One record, every year of learning
          </p>
          <h1 className="mt-4 max-w-md font-display text-[2.6rem] font-medium leading-[1.1]">
            The register that turns learning into credit.
          </h1>

          <div className="mt-9 max-w-md rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-indigo-200">
              <span>Entry</span>
              <span>Record</span>
              <span>State</span>
            </div>
            <ul className="space-y-2.5">
              {LEDGER_ROWS.map((r) => (
                <li key={r.i} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-indigo-300">{r.i}</span>
                  <span className="min-w-0 flex-1 truncate text-white/90">{r.t}</span>
                  <span className={`font-mono text-[10px] uppercase tracking-wide ${r.c}`}>
                    ● {r.s}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative font-mono text-[11px] text-indigo-300">
          Centurion University of Technology &amp; Management
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-parchment px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LedgerMark small />
            <span className="font-display text-lg text-ink">ALR</span>
          </div>

          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-1 font-display text-3xl text-ink">Sign in to the register</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Continue recording and evaluating learning.
          </p>

          <form action={action} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                University email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="field"
                placeholder="you@cutm.ac.in"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="field"
                placeholder="••••••••"
              />
            </div>
            {state?.error && (
              <p className="rounded-lg border border-seal-100 bg-seal-50 px-3 py-2 text-sm text-seal-600">
                {state.error}
              </p>
            )}
            <SubmitButton />
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            New here?{' '}
            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-800">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function LedgerMark({ small }: { small?: boolean }) {
  const size = small ? 'h-9 w-9' : 'h-10 w-10';
  return (
    <span
      className={`flex ${size} items-center justify-center rounded-lg ${
        small ? 'bg-indigo-800' : 'bg-white/10 ring-1 ring-white/15'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M6 4h9a3 3 0 0 1 3 3v13H9a3 3 0 0 1-3-3V4Z"
          stroke="currentColor"
          strokeWidth="1.6"
          className="text-white"
        />
        <path d="M9 8.5h6M9 12h6M9 15.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-brass-400" />
      </svg>
    </span>
  );
}
