import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getSiteUrl, SITE } from '@/lib/site';
import { pageMeta } from '@/lib/seo';
import LandingClient from './LandingClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  ...pageMeta({
    title: `${SITE.shortName} — Annual Learning Record | ${SITE.orgShort}`,
    description: SITE.description,
    path: '/',
    index: true,
  }),
  title: { absolute: `${SITE.shortName} — Annual Learning Record | ${SITE.orgShort}` },
};

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: SITE.appName,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        url: getSiteUrl(),
        description: SITE.description,
        image: `${getSiteUrl()}/opengraph-image`,
        provider: {
          '@type': 'CollegeOrUniversity',
          name: SITE.org,
          url: 'https://cutm.ac.in',
          logo: `${getSiteUrl()}/cutm-logo.png`,
        },
      },
      {
        '@type': 'WebSite',
        name: SITE.appName,
        url: getSiteUrl(),
        publisher: { '@type': 'CollegeOrUniversity', name: SITE.org },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingClient />
    </>
  );
}
