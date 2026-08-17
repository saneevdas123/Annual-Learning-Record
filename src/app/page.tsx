import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import GooglyEyes from '@/components/GooglyEyes';

export const dynamic = 'force-dynamic';

const FEATURES = [
  {
    title: 'Course-by-course ledger',
    body: 'Each subject configuration maps to the exact record types the Framework requires — with weights you can see.',
    tone: 'bg-accent-yellow',
  },
  {
    title: 'Sequential sign-off',
    body: 'Faculty scores first. Mentor and HoD confirm in order. Nothing jumps the queue.',
    tone: 'bg-accent-mint',
  },
  {
    title: 'Credit that posts',
    body: 'Year-wise evaluation signs off 1 compulsory-basket credit and can export to the exam cell.',
    tone: 'bg-accent-peach',
  },
  {
    title: 'Appeals, not silence',
    body: 'Students can challenge a score. Reviewers resolve it. The decision is logged.',
    tone: 'bg-accent-pink',
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="landing-page min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b-2 border-ink">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
            <GooglyEyes size={24} />
            <span>ALR</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost !py-2 !px-4 text-sm">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary !py-2 !px-4 text-sm">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="hero-rise">
          <p className="text-brand font-semibold italic text-sm mb-2">Centurion University</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.08]">
            The register that turns learning into credit.
          </h1>
          <p className="mt-4 text-ink/60 text-base sm:text-lg leading-relaxed max-w-xl">
            File classroom, practice, project, and internship records. Review them in order. Post the annual credit —
            without a paper booklet.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary hero-cta-shine !py-3 !px-6">
              Create student account
            </Link>
            <Link href="/login" className="btn-ghost !py-3 !px-6">
              Sign in
            </Link>
          </div>
        </div>
        <div className="hero-panel relative">
          <div className="card p-5 bg-white hero-float">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-neo border-2 border-ink bg-cream p-2 shadow-hard-sm">
                <Image
                  src="/cutm-logo.png"
                  alt="CUTM"
                  width={48}
                  height={72}
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink/45">Live ledger</p>
                <p className="font-bold">Annual Learning Record</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              {[
                ['Classroom Learning', 'Approved', 'bg-accent-mint'],
                ['Applied Action Learning', 'Under review', 'bg-accent-yellow'],
                ['Project Report', 'Draft', 'bg-cream'],
              ].map(([t, s, bg]) => (
                <li key={t} className={`flex items-center justify-between rounded-xl border border-ink/10 px-3 py-2.5 ${bg}`}>
                  <span className="text-sm font-semibold">{t}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink/55">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <p className="text-brand font-semibold italic text-sm mb-2">How it works</p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Same platform. Clearer record.</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <article key={f.title} className={`card land-card p-5 ${f.tone}`}>
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-ink/65 leading-relaxed">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="card bg-ink text-cream p-8 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ready to file this year&apos;s record?</h2>
          <p className="mt-2 text-cream/70 max-w-xl">
            Students register here. Faculty and officers receive credentials from Administration.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary hero-cta-shine">
              Get started
            </Link>
            <Link href="/login" className="btn-ghost !bg-cream">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer border-t-2 border-ink">
        <div className="landing-footer-bar" />
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-bold">ALR · Centurion University</span>
          <span className="text-ink/50">Annual Learning Record digitisation</span>
        </div>
      </footer>
    </div>
  );
}
