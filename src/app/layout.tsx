import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import AppToaster from '@/components/AppToaster';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ALR — Annual Learning Record | Centurion University',
    template: '%s · ALR',
  },
  description:
    'The Annual Learning Record platform for Centurion University of Technology and Management — recording, evaluating, and crediting student learning across the program.',
  applicationName: 'ALR',
  icons: {
    icon: '/cutm-logo.png',
    apple: '/cutm-logo.png',
  },
  other: {
    'theme-color': '#FF4B3E',
  },
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
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-cream text-ink" suppressHydrationWarning>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
