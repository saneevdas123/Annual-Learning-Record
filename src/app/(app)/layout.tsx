import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { logoutAction } from '../(auth)/actions';
import { initials } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/domain';
import { NavLink } from '@/components/NavLink';

export const dynamic = 'force-dynamic';

const NAV: { href: string; label: string; roles?: string[] }[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/records', label: 'My Records', roles: ['STUDENT'] },
  { href: '/courses', label: 'Courses' },
  { href: '/review', label: 'Review Queue', roles: ['FACULTY', 'MENTOR', 'HOD', 'DEAN'] },
  { href: '/evaluations', label: 'Evaluations', roles: ['HOD', 'DEAN', 'ADMIN'] },
  { href: '/credits', label: 'Credit Ledger', roles: ['STUDENT', 'HOD', 'DEAN', 'ADMIN'] },
  { href: '/analytics', label: 'Analytics', roles: ['HOD', 'DEAN', 'ADMIN'] },
  { href: '/admin', label: 'Administration', roles: ['ADMIN'] },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const nav = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-parchment">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-indigo-100 bg-indigo-900 text-white lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M6 4h9a3 3 0 0 1 3 3v13H9a3 3 0 0 1-3-3V4Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M9 8.5h6M9 12h6M9 15.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-brass-400" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg">ALR</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-indigo-300">
              Learning Record
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((n) => (
            <NavLink key={n.href} href={n.href} label={n.label} />
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs font-semibold text-white"
              style={{ background: user.avatarColor }}
            >
              {initials(user.name)}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block font-mono text-[10px] uppercase tracking-wide text-indigo-300">
                {ROLE_LABELS[user.role]}
              </span>
            </span>
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-indigo-100 bg-parchment/80 px-4 backdrop-blur lg:px-8">
          <p className="eyebrow hidden lg:block">
            Centurion University of Technology &amp; Management
          </p>
          {/* Mobile brand */}
          <span className="font-display text-lg text-ink lg:hidden">ALR</span>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="btn-ghost px-3 py-1.5 text-xs">
              Profile
            </Link>
            <form action={logoutAction}>
              <button className="btn-outline px-3 py-1.5 text-xs">Sign out</button>
            </form>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-indigo-100 bg-surface px-3 py-2 lg:hidden">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-indigo-50"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
