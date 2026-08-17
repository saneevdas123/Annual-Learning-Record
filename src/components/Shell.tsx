'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ROLE_LABELS } from '@/lib/domain';
import { ConfirmDialog } from '@/components/ui';
import { CutmLogo, CutmMark } from '@/components/CutmMark';
import { NotificationBell, type Notice } from '@/components/NotificationBell';
import { logoutAction } from '@/app/(auth)/actions';
import { initials } from '@/lib/utils';

type NavItem = { href: string; label: string; icon?: IconName };

type IconName = 'home' | 'chart' | 'file' | 'layers' | 'grid' | 'users' | 'logout' | 'menu' | 'close';

function Icon({ name, className = 'w-[18px] h-[18px]' }: { name: IconName; className?: string }) {
  const props = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10.5V20h14v-9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...props}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 16v-5" />
          <path d="M12 16V8" />
          <path d="M16 16v-3" />
        </svg>
      );
    case 'file':
      return (
        <svg {...props}>
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
          <path d="M10 13h6M10 17h4" />
        </svg>
      );
    case 'layers':
      return (
        <svg {...props}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 17 9 5 9-5" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'users':
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 19a4.5 4.5 0 0 1 5-4.2" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...props}>
          <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1 2-2v-2" />
          <path d="M4 12h10" />
          <path d="m8 8-4 4 4 4" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...props}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'close':
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

function navIcon(item: NavItem): IconName {
  const h = `${item.href} ${item.label}`.toLowerCase();
  if (h.includes('credit')) return 'layers';
  if (h.includes('analytic') || h.includes('eval')) return 'chart';
  if (h.includes('record') || h.includes('review')) return 'file';
  if (h.includes('admin') || h.includes('people')) return 'users';
  if (h.includes('overview') || h.includes('dashboard')) return 'home';
  if (h.includes('course')) return 'grid';
  return 'grid';
}

function isActivePath(pathname: string, href: string, allHrefs: string[]) {
  if (pathname === href) return true;
  if (!href || href === '/' || !pathname.startsWith(`${href}/`)) return false;
  const longerMatch = allHrefs.some(
    (h) => h !== href && h.length > href.length && (pathname === h || pathname.startsWith(`${h}/`))
  );
  return !longerMatch;
}

function NavList({
  nav,
  pathname,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const hrefs = nav.map((n) => n.href);

  return (
    <nav className="shell-nav" aria-label="Main">
      {nav.map((n) => {
        const active = isActivePath(pathname, n.href, hrefs);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={`shell-nav-link${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="shell-nav-ico">
              <Icon name={navIcon(n)} />
            </span>
            <span className="shell-nav-label">{n.label}</span>
            {active ? <span className="shell-nav-pip" aria-hidden /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu({ role, name, onLogout }: { role: string; name: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`shell-user${open ? ' is-open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="shell-user-trigger"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="shell-avatar">{initials(name)}</span>
        <span className="shell-user-meta hidden sm:flex">
          <span className="shell-user-name">{name}</span>
          <span className="shell-user-role">{ROLE_LABELS[role] || role}</span>
        </span>
      </button>
      <div id={menuId} className="shell-user-panel" role="menu">
        <div className="shell-user-panel-head">
          <div className="font-bold text-sm text-ink truncate">{name}</div>
          <div className="text-xs text-ink/55 font-medium">{ROLE_LABELS[role] || role}</div>
        </div>
        <Link href="/profile" className="btn-ghost w-full !justify-start mb-2" role="menuitem">
          Profile
        </Link>
        <button
          type="button"
          className="shell-logout"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
        >
          <Icon name="logout" className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Shell({
  role,
  name,
  nav,
  notices,
  children,
}: {
  role: string;
  name: string;
  nav: NavItem[];
  notices: Notice[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function askLogout() {
    setMobileOpen(false);
    setConfirmOut(true);
  }

  async function confirmLogout() {
    if (signingOut) return;
    setSigningOut(true);
    await logoutAction();
  }

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="shell min-h-screen flex bg-cream">
      <aside className="shell-aside hidden md:flex no-print">
        <div className="shell-brand">
          <CutmMark variant="sidebar" title="ALR" subtitle="Learning Record" priority />
          <div className="shell-brand-role">{ROLE_LABELS[role] || role}</div>
        </div>
        <NavList nav={nav} pathname={pathname} />
        <div className="shell-aside-foot">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="inline-flex rounded-lg border border-cream/20 bg-cream p-0.5">
              <CutmLogo height={22} />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cream/45">
              Centurion University
            </span>
          </div>
          <button type="button" className="shell-logout" onClick={askLogout}>
            <Icon name="logout" className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="shell-drawer md:hidden no-print" role="dialog" aria-modal="true">
          <button
            type="button"
            className="shell-drawer-backdrop"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="shell-aside shell-aside-mobile">
            <div className="shell-brand flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href="/" className="shell-brand-link" onClick={() => setMobileOpen(false)}>
                  <CutmMark variant="sidebar" href={null} title="ALR" subtitle="Learning Record" />
                </Link>
                <div className="shell-brand-role">{ROLE_LABELS[role] || role}</div>
              </div>
              <button
                type="button"
                className="shell-icon-btn !bg-cream !text-ink shrink-0"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <NavList nav={nav} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="shell-aside-foot">
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="inline-flex rounded-lg border border-cream/20 bg-cream p-0.5">
                  <CutmLogo height={20} />
                </span>
                <span className="text-xs text-cream/55 truncate">{name}</span>
              </div>
              <button type="button" className="shell-logout" onClick={askLogout}>
                <Icon name="logout" className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <main className="shell-main flex-1 min-w-0 flex flex-col">
        <header className="shell-topbar no-print">
          <button
            type="button"
            className="shell-icon-btn md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <CutmMark variant="compact" className="md:hidden" title="ALR" />
          <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-ink/55 tracking-tight">
            <CutmLogo height={22} />
            <span>Centurion University</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell items={notices} />
            <UserMenu role={role} name={name} onLogout={askLogout} />
          </div>
        </header>
        <div className="print-brand hidden print:flex items-center gap-3 border-b-2 border-ink pb-3 mb-4">
          <CutmLogo height={52} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink/45">CUTM</p>
            <p className="font-bold text-ink">Annual Learning Record</p>
            <p className="text-xs text-ink/55">Centurion University of Technology and Management</p>
          </div>
        </div>
        <div className="shell-content p-3 sm:p-5 md:p-6">{children}</div>
      </main>

      <ConfirmDialog
        open={confirmOut}
        onClose={() => setConfirmOut(false)}
        title="Sign out?"
        description="You will need to sign in again to return to your dashboard."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        danger
        loading={signingOut}
        loadingText="Signing out…"
        onConfirm={confirmLogout}
      />
    </div>
  );
}
