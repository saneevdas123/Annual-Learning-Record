import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { db } from '@/lib/db';
import Shell from '@/components/Shell';

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
  const notices = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <Shell role={user.role} name={user.name} nav={nav} notices={notices}>
      {children}
    </Shell>
  );
}
