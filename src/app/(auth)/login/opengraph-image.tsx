import { ogResponse } from '@/lib/og';

export const alt = 'Sign in to CUTM Annual Learning Record';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return ogResponse({
    eyebrow: 'Account',
    title: 'Sign in to the learning ledger.',
    subtitle: 'Students, faculty, mentors, and deans use one record of learning.',
  });
}
