/**
 * Public site identity for emails and absolute URLs.
 * Prefer APP_URL from env (same as Mentor-Mentee).
 */
export function getSiteUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
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
  description:
    'The Annual Learning Record platform for Centurion University — recording, evaluating, and crediting student learning across the program.',
};
