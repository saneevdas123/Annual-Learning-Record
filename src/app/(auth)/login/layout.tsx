import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Sign in',
  description: 'Sign in to the CUTM Annual Learning Record to file, review, and credit student learning.',
  path: '/login',
  index: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
