/**
 * Public site identity for emails, absolute URLs, and Metadata API.
 * Prefer APP_URL from env (same as Mentor-Mentee).
 */
export function getSiteUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

export const SITE = {
  name: 'CUTM ALR',
  shortName: 'ALR',
  appName: 'CUTM Annual Learning Record',
  org: 'Centurion University of Technology and Management',
  orgShort: 'Centurion University',
  locale: 'en_IN',
  description:
    'The Annual Learning Record platform for Centurion University — recording, evaluating, and crediting student learning across the program.',
  keywords: [
    'Annual Learning Record',
    'ALR',
    'Centurion University',
    'CUTM',
    'learning records',
    'NAAC',
    'NBA',
    'student evaluation',
    'credit ledger',
    'Paralakhemundi',
  ],
};
