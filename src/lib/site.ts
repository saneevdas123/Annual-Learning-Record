/**
 * Public site identity for emails, absolute URLs, and Metadata API.
 * Prefer APP_URL from env (same as Mentor-Mentee).
 */
function vercelUrl() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host.replace(/^https?:\/\//, '')}` : null;
}

export function getSiteUrl() {
  const raw = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const local = !raw || /localhost|127\.0\.0\.1/.test(raw);
  if (process.env.VERCEL && local) {
    return (vercelUrl() || 'https://annual-learning-record-opal.vercel.app').replace(/\/$/, '');
  }
  if (raw && !local) return raw;
  return (vercelUrl() || raw || 'http://localhost:3000').replace(/\/$/, '');
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
