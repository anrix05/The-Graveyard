import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard/',
        '/dashboard',
        '/login',
        '/forgot-password',
        '/reset-password',
        '/auth/',
        '/onboarding',
        '/submit',
        '/orders/',
        '/collab/',
        '/design-system/responsive',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
