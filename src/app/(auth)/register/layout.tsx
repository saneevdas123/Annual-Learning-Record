import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Create your account',
  description: 'Register with your university email to start filing Annual Learning Records at Centurion University.',
  path: '/register',
  index: true,
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
