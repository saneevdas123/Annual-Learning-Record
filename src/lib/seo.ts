import type { Metadata } from 'next';
import { getSiteUrl, SITE } from './site';

export function pageMeta({
  title,
  description,
  path,
  index = false,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const url = `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const fullTitle = title;
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    keywords: SITE.keywords,
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    openGraph: {
      title: `${fullTitle} · ${SITE.shortName}`,
      description,
      url,
      siteName: SITE.appName,
      locale: SITE.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${fullTitle} · ${SITE.shortName}`,
      description,
    },
  };
}
