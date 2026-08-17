'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CutmMark } from '@/components/CutmMark';

const TICKER = [
  'classroom record submitted',
  'faculty scored a lab booklet',
  'mentor signed the next step',
  'HoD closed the chain',
  '1 ALR credit posted',
  'appeal resolved with a note',
];

const FEATURES = [
  {
    title: 'Course-by-course ledger',
    body: 'Each of the twelve subject configurations maps to the exact record types the Framework requires — with weights you can see.',
    tone: 'bg-accent-yellow',
  },
  {
    title: 'Sequential sign-off',
    body: 'Faculty scores first. Mentor and HoD confirm in order. Nothing jumps the queue, and every step is timestamped.',
    tone: 'bg-accent-mint',
  },
  {
    title: 'Credit that posts',
    body: 'Year-wise evaluation signs off 1 compulsory-basket credit and can export a clean line to the exam cell.',
    tone: 'bg-accent-peach',
  },
  {
    title: 'Appeals, not silence',
    body: 'Students can challenge a score. Reviewers resolve it. The decision stays on the record.',
    tone: 'bg-accent-pink',
  },
];

const AUDIENCE = [
  { title: 'Students', body: 'File the records your course actually needs. Watch sign-off move. See credit land in the compulsory basket.' },
  { title: 'Faculty', body: 'Score the booklet for your course. Request an advisory AI pass. Return work that is not ready.' },
  { title: 'Mentors', body: 'Sign the PO/PSO step for your mentees — only when faculty has already acted.' },
  { title: 'HoD & Dean', body: 'Close the chain, run the year rubric, and export credit without rebuilding a spreadsheet.' },
];

const STEPS = [
  { n: 1, color: 'bg-brand', title: 'File the right record', body: 'Pick the course. The platform only offers the record types that configuration requires.' },
  { n: 2, color: 'bg-accent-mint', title: 'Sign in order', body: 'Faculty → Mentor → HoD. Each person sees the queue only when it is their step.' },
  { n: 3, color: 'bg-accent', title: 'Post the year', body: 'The year rubric signs off 1 credit. Program compilation sits on top when you need it.' },
];

const FAQ = [
  {
    q: 'Who can create an account?',
    a: 'Students register with a @cutm.ac.in email. Faculty, mentors, and officers are provisioned by Administration and get a sign-in mail.',
  },
  {
    q: 'Is the AI score the final mark?',
    a: 'No. AI is advisory. A three-agent pass extracts evidence, scores the rubric, then a critic checks inflation. Faculty always overrides.',
  },
  {
    q: 'What if I am not enrolled in a course?',
    a: 'Ask your department to enroll you. Required records appear on your dashboard only after enrollment.',
  },
  {
    q: 'Can I change a submitted record?',
    a: 'Not while it is in review. If it comes back as revision, you can edit and submit again. Approved records stay locked.',
  },
  {
    q: 'How does industry assessment work?',
    a: 'Supervisors open a one-time token link. No campus login. The score writes to the deliverable and the link expires.',
  },
];

function useReveal() {
  useEffect(() => {
    document.documentElement.classList.add('js-landing');
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!nodes.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('is-in');
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );
    nodes.forEach((n) => io.observe(n));
    return () => {
      io.disconnect();
      document.documentElement.classList.remove('js-landing');
    };
  }, []);
}

function useHeroTilt(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (window.matchMedia('(max-width: 767px)').matches) return undefined;

    function onMove(e: MouseEvent) {
      const box = el!.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width - 0.5;
      const y = (e.clientY - box.top) / box.height - 0.5;
      el!.style.setProperty('--tilt-x', `${(-y * 6).toFixed(2)}deg`);
      el!.style.setProperty('--tilt-y', `${(x * 7).toFixed(2)}deg`);
    }
    function onLeave() {
      el!.style.setProperty('--tilt-x', '0deg');
      el!.style.setProperty('--tilt-y', '0deg');
    }
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [ref]);
}

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="land-card card bg-white overflow-hidden">
      <button
        type="button"
        className="w-full text-left px-4 sm:px-5 py-4 flex items-start justify-between gap-3"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-bold text-[15px] leading-snug text-ink pr-2">{q}</span>
        <span
          className={`shrink-0 w-7 h-7 rounded-lg border-2 border-ink bg-cream flex items-center justify-center text-lg font-bold leading-none transition-transform duration-200 ${open ? 'rotate-45 bg-accent-yellow' : ''}`}
          aria-hidden
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="px-4 sm:px-5 pb-4 text-sm text-ink/65 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingClient() {
  const tiltRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  useReveal();
  useHeroTilt(tiltRef);

  return (
    <div className="landing-page min-h-screen bg-cream text-ink">
      <div className="border-b-2 border-ink bg-ink text-cream overflow-hidden">
        <div className="landing-marquee flex gap-10 py-2 text-[11px] font-bold uppercase tracking-[0.14em] whitespace-nowrap">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={`${item}-${i}`} className="inline-flex items-center gap-10">
              <span className="text-brand">●</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b-2 border-ink">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <CutmMark variant="compact" title="ALR" subtitle="CUTM" priority />
          <nav className="hidden md:flex items-center gap-5 text-sm font-semibold">
            <a href="#how" className="footer-link">
              How it works
            </a>
            <a href="#roles" className="footer-link">
              Roles
            </a>
            <a href="#faq" className="footer-link">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost !py-2 !px-4 text-sm hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary !py-2 !px-4 text-sm">
              Get started
            </Link>
            <button
              type="button"
              className="md:hidden btn-ghost !py-2 !px-3 text-sm"
              aria-expanded={menu}
              aria-label="Menu"
              onClick={() => setMenu((v) => !v)}
            >
              {menu ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
        {menu ? (
          <div className="md:hidden border-t-2 border-ink bg-cream px-4 py-3 flex flex-col gap-2 text-sm font-semibold">
            <a href="#how" onClick={() => setMenu(false)}>
              How it works
            </a>
            <a href="#roles" onClick={() => setMenu(false)}>
              Roles
            </a>
            <a href="#faq" onClick={() => setMenu(false)}>
              FAQ
            </a>
            <Link href="/login" onClick={() => setMenu(false)}>
              Sign in
            </Link>
          </div>
        ) : null}
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="hero-rise hero-d1 text-brand font-semibold italic text-sm mb-2">Centurion University</p>
          <h1 className="hero-rise hero-d2 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.08]">
            The register that turns learning into credit.
          </h1>
          <p className="hero-rise hero-d3 mt-4 text-ink/60 text-base sm:text-lg leading-relaxed max-w-xl">
            File classroom, practice, project, and internship records. Review them in order. Post the annual credit —
            without a paper booklet.
          </p>
          <div className="hero-rise hero-d4 mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary hero-cta-shine !py-3 !px-6">
              Create student account
            </Link>
            <Link href="/login" className="btn-ghost !py-3 !px-6">
              Sign in
            </Link>
          </div>
        </div>

        <div className="hero-panel hero-stage relative" ref={tiltRef}>
          <div className="hero-tilt">
            <div className="card p-5 bg-white hero-float relative">
              <div className="tape" aria-hidden>
                Live
              </div>
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
                  ['Classroom Learning', 'Approved', 'bg-accent-mint', '-2deg'],
                  ['Applied Action Learning', 'Under review', 'bg-accent-yellow', '1.5deg'],
                  ['Project Report', 'Draft', 'bg-cream', '-1deg'],
                ].map(([t, s, bg, rot]) => (
                  <li
                    key={t}
                    className={`hero-feed-card flex items-center justify-between rounded-xl border-2 border-ink px-3 py-2.5 ${bg}`}
                    style={{ ['--hero-rot' as string]: rot, transform: `rotate(${rot})` }}
                  >
                    <span className="text-sm font-semibold">{t}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-ink/55">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-4 pb-16">
        <p className="reveal text-brand font-semibold italic text-sm mb-2">How it works</p>
        <h2 className="reveal reveal-d1 text-2xl sm:text-3xl font-bold tracking-tight mb-6">Same platform. Clearer record.</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {STEPS.map((s, i) => (
            <article key={s.n} className={`reveal reveal-d${i + 1} card land-card p-5 bg-white`}>
              <span
                className={`land-card-icon inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink ${s.color} text-sm font-bold shadow-hard-sm`}
              >
                {s.n}
              </span>
              <h3 className="mt-3 font-bold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-ink/65 leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <article key={f.title} className={`reveal reveal-d${(i % 4) + 1} card land-card p-5 ${f.tone}`}>
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-ink/65 leading-relaxed">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="roles" className="bg-ink text-cream border-y-2 border-ink">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <p className="reveal text-accent font-semibold italic text-sm mb-2">Who it is for</p>
          <h2 className="reveal reveal-d1 text-2xl sm:text-3xl font-bold tracking-tight mb-6">Everyone sees their own step.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {AUDIENCE.map((a, i) => (
              <article
                key={a.title}
                className={`reveal reveal-d${i + 1} land-card-dark rounded-neo border border-cream/15 p-4`}
              >
                <h3 className="font-bold">{a.title}</h3>
                <p className="mt-2 text-sm text-cream/70 leading-relaxed">{a.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="max-w-3xl mx-auto px-4 py-16">
        <p className="reveal text-brand font-semibold italic text-sm mb-2 text-center">Questions</p>
        <h2 className="reveal reveal-d1 text-2xl sm:text-3xl font-bold tracking-tight mb-6 text-center">
          Before you file the first record
        </h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={item.q} className={`reveal reveal-d${(i % 4) + 1}`}>
              <FaqItem q={item.q} a={item.a} defaultOpen={i === 0} />
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="reveal card bg-ink text-cream p-8 sm:p-10">
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
        <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8 text-sm">
          <div>
            <CutmMark variant="light" href="/" title="ALR" subtitle="Centurion University" />
            <p className="mt-3 text-ink/55 leading-relaxed">
              Annual Learning Record for Centurion University of Technology and Management.
            </p>
          </div>
          <div className="flex flex-col gap-2 font-semibold">
            <a href="#how" className="footer-link w-fit">
              How it works
            </a>
            <a href="#roles" className="footer-link w-fit">
              Roles
            </a>
            <a href="#faq" className="footer-link w-fit">
              FAQ
            </a>
          </div>
          <div className="text-ink/55">
            <p>Faculty → Mentor → HoD</p>
            <p className="mt-1">1 credit / year · compulsory basket</p>
            <p className="mt-1 italic">Shaping Lives · Empowering Communities</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
