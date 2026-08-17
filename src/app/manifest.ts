import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.appName,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#FDF8F0',
    theme_color: '#FF4B3E',
    lang: 'en-IN',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { src: '/icon', type: 'image/png', sizes: '192x192' },
      { src: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  };
}
