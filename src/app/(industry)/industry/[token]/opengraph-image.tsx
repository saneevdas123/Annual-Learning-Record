import { ogResponse } from '@/lib/og';

export const alt = 'Industry supervisor review — CUTM Annual Learning Record';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return ogResponse({
    eyebrow: 'External assessment',
    title: 'Industry supervisor review.',
    subtitle: 'A signed link for internship and industry deliverable assessment — no login required.',
  });
}
