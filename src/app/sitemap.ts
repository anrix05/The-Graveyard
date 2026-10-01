import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    console.warn(
      '[Sitemap] NEXT_PUBLIC_SITE_URL is not set. Defaulting to: ' + baseUrl
    );
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/design-system`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  let projectRoutes: MetadataRoute.Sitemap = [];

  try {
    // Fetch live non-sold projects with anon client (public RLS)
    const { data: projects } = await supabase
      .from('projects')
      .select('id, created_at')
      .eq('is_sold', false)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (projects) {
      projectRoutes = projects.map((p) => ({
        url: `${baseUrl}/project/${p.id}`,
        lastModified: p.created_at ? new Date(p.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('[Sitemap] Failed to fetch live projects:', err);
  }

  return [...staticRoutes, ...projectRoutes];
}
