import { Suspense } from 'react';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import Shell from '@/components/Shell';
import { BellSkeleton, Notifications } from './Notifications';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
    <Shell
      role={user.role}
      name={user.name}
      nav={nav}
      noticesSlot={
        <Suspense fallback={<BellSkeleton />}>
          <Notifications userId={user.id} />
        </Suspense>
      }
    >
      {children}
    </Shell>
  );
}
