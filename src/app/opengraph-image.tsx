import { ogResponse } from '@/lib/og';
import { SITE } from '@/lib/site';

export const alt = `${SITE.appName} — ${SITE.org}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return ogResponse({
    title: 'Every student’s learning, recorded and credited.',
    subtitle: SITE.description,
  });
}
