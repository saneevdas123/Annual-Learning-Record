import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Change password',
  description: 'Set a new password for your CUTM Annual Learning Record account.',
  path: '/account/password',
});

export default function PasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
