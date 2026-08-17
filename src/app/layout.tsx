import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import AppToaster from '@/components/AppToaster';
import { getSiteUrl, SITE } from '@/lib/site';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE.shortName} — Annual Learning Record | ${SITE.orgShort}`,
    template: `%s · ${SITE.shortName}`,
  },
  description: SITE.description,
  applicationName: SITE.appName,
  authors: [{ name: SITE.org, url: 'https://cutm.ac.in' }],
  creator: SITE.org,
  publisher: SITE.org,
  keywords: SITE.keywords,
  category: 'education',
  referrer: 'origin-when-cross-origin',
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: '/',
    siteName: SITE.appName,
    title: `${SITE.shortName} — Annual Learning Record | ${SITE.orgShort}`,
    description: SITE.description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `${SITE.appName} — ${SITE.org}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.shortName} — Annual Learning Record`,
    description: SITE.description,
    images: ['/og.png'],
  },
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png', sizes: '32x32' }],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: SITE.shortName,
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FF4B3E' },
    { media: '(prefers-color-scheme: dark)', color: '#141414' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={outfit.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-cream text-ink" suppressHydrationWarning>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
