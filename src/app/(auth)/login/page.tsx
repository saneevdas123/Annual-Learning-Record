'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { loginAction } from '../actions';
import GooglyEyes from '@/components/GooglyEyes';
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
          Signing in…
        </>
      ) : (
        'Sign in'
      )}
    </button>
  );
}

function LoginForm() {
  const [state, action] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  return (
    <div className="login-board">
      <div className="login-board-inner">
        <h2 className="text-2xl font-bold mb-1">Sign in</h2>
        <p className="text-sm text-ink/60 mb-6">Use your university email to open the learning record.</p>

        {state?.error && <div className="mb-4 text-sm text-ink ui-callout-danger px-3 py-2">{state.error}</div>}

        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="label" htmlFor="login-email">
              University email
            </label>
            <input
              id="login-email"
              name="email"
              className="input"
              type="email"
              required
              autoComplete="username"
              placeholder="you@cutm.ac.in"
            />
          </div>
          <PasswordField id="login-password" label="Password" required autoComplete="current-password" />
          <SubmitButton />
        </form>

        <p className="text-xs text-ink/45 mt-6 text-center md:text-left">
          Students can create an account. Faculty and staff are provisioned by an administrator.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b-2 border-ink">
        <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
            <GooglyEyes size={24} />
            <span>ALR</span>
          </Link>
          <Link href="/" className="btn-ghost !py-2 !px-4 text-sm">
            Back to home
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
              Annual
              <br />
              Learning Record
            </h1>
            <p className="text-cream/70 mt-5 max-w-sm text-sm leading-relaxed">
              File records, review sign-off, and post credit — one register for every year of learning.
            </p>
          </div>
          <ul className="relative z-10 text-sm text-cream/80 space-y-3 mt-10">
            {[
              'Twelve subject configurations, mapped to the right record types',
              'Faculty → Mentor → HoD sequential sign-off',
              'Year-wise evaluation and compulsory-basket credit',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-brand font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="md:hidden flex flex-col items-center text-center mb-6">
              <div className="rounded-neo border-2 border-ink bg-white p-3 shadow-hard-sm mb-3">
                <Image
                  src="/cutm-logo.png"
                  alt="Centurion University"
                  width={64}
                  height={98}
                  className="h-14 w-auto object-contain"
                  priority
                />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-ink/45">Centurion University</div>
            </div>
            <Suspense fallback={<div className="login-board"><div className="login-board-inner h-64" /></div>}>
              <LoginForm />
            </Suspense>
            <p className="mt-6 text-center text-sm text-ink/55">
              New student?{' '}
              <Link href="/register" className="font-semibold text-brand hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
