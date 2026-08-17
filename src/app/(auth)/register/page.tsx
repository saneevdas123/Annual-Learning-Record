'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { registerAction } from '../actions';
import { CutmMark } from '@/components/CutmMark';
import { PasswordField } from '@/components/PasswordField';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-primary hero-cta-shine w-full !py-3 inline-flex items-center justify-center gap-2"
      disabled={pending}
    >
      {pending ? (
        <>
          <span className="login-btn-spinner" aria-hidden />
          Creating…
        </>
      ) : (
        'Create account'
      )}
    </button>
  );
}

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b-2 border-ink">
        <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <CutmMark variant="compact" title="ALR" subtitle="CUTM" priority />
          <Link href="/login" className="btn-ghost !py-2 !px-4 text-sm">
            Sign in
          </Link>
        </div>
      </header>

      <div className="flex-1 grid md:grid-cols-2">
        <div className="relative hidden md:flex flex-col justify-between bg-ink text-cream p-10 border-r-2 border-ink overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #FDF8F0 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }}
            aria-hidden
          />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="rounded-neo border-2 border-cream/30 bg-cream p-3 shadow-hard-sm">
                <Image
                  src="/cutm-logo.png"
                  alt="Centurion University"
                  width={72}
                  height={110}
                  className="h-16 w-auto object-contain"
                  priority
                />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-accent">CUTM</div>
                <div className="font-semibold text-sm leading-snug text-cream/90 max-w-[12rem]">
                  Centurion University of Technology and Management
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight">
              Start your
              <br />
              learning record
            </h1>
            <p className="text-cream/70 mt-5 max-w-sm text-sm leading-relaxed">
              Public signup is for students only. Faculty, mentors, and officers are created by Administration.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className={`login-board${pending ? ' is-loading' : ''}`}>
              <div className="login-board-inner">
                <h2 className="text-2xl font-bold mb-1">Create account</h2>
                <p className="text-sm text-ink/60 mb-6">
                  Register as a student with your university email (@cutm.ac.in).
                </p>

                {state?.error && (
                  <div className="mb-4 text-sm text-ink ui-callout-danger px-3 py-2">{state.error}</div>
                )}

                <form action={action} className="space-y-4">
                  <div>
                    <label className="label" htmlFor="reg-name">
                      Full name
                    </label>
                    <input id="reg-name" name="name" required className="input" />
                  </div>
                  <div>
                    <label className="label" htmlFor="reg-email">
                      University email
                    </label>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      className="input"
                      placeholder="you@cutm.ac.in"
                    />
                  </div>
                  <PasswordField
                    id="reg-password"
                    label="Password (min 8 characters)"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <div>
                    <label className="label" htmlFor="reg-no">
                      Registration number
                      <span className="ui-field-optional">optional</span>
                    </label>
                    <input id="reg-no" name="registrationNumber" className="input" placeholder="e.g. 210101120001" />
                  </div>
                  <SubmitButton />
                </form>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-ink/55">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-brand hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
