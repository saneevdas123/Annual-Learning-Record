import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getSiteUrl, SITE } from '@/lib/site';
import LandingClient from './LandingClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE.appName,
    applicationCategory: 'EducationalApplication',
    url: getSiteUrl(),
    provider: {
      '@type': 'CollegeOrUniversity',
      name: SITE.org,
      logo: `${getSiteUrl()}/cutm-logo.png`,
    },
    image: `${getSiteUrl()}/cutm-logo.png`,
    description: SITE.description,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingClient />
    </>
  );
}
