import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/env';

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data: project } = await supabase
      .from('projects')
      .select('id, title, tagline, description, interaction_type, is_archived, is_sold')
      .eq('id', id)
      .maybeSingle();

    if (!project) {
      return {
        title: 'Project Not Found',
        robots: { index: false, follow: false },
      };
    }

    const modeLabels: Record<string, string> = {
      buy: 'For sale',
      adopt: 'Free fork',
      collab: 'Seeking partner',
    };
    const modeLabel = modeLabels[project.interaction_type || ''] || 'For sale';

    const plainDesc = (project.tagline || project.description || '')
      .replace(/[#*`_~\[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150);

    const title = `${project.title} · ${modeLabel}`;
    const description =
      plainDesc ||
      'Abandoned codebase ready for resurrection. Liquidate, adopt, or partner on The Graveyard.';
    const canonical = `${SITE_URL}/project/${project.id}`;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        type: 'website',
        locale: 'en_IN',
        siteName: 'The Graveyard',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      robots: project.is_archived
        ? { index: false, follow: true }
        : { index: true, follow: true },
    };
  } catch {
    return {
      title: 'Project · The Graveyard',
      robots: { index: false, follow: false },
    };
  }
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  return <>{children}</>;
}
