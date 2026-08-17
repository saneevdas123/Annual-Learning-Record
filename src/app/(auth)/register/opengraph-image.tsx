import { ogResponse } from '@/lib/og';

export const alt = 'Create a CUTM Annual Learning Record account';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return ogResponse({
    eyebrow: 'Students',
    title: 'Create your ALR account.',
    subtitle: 'Use your @cutm.ac.in email. The first account on a fresh campus becomes admin.',
  });
}
