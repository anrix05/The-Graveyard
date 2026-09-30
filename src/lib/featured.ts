import { Project, InteractionType } from '@/types/project';
import { supabase } from '@/lib/supabase';

/**
 * Returns up to 3 live listings for the Featured Resurrections section:
 * 1. Checks for projects with `is_featured = true`, ordered by `featured_rank` ascending.
 * 2. If fewer than 3, fills remaining slots with the most-viewed live listings,
 *    preferring diversity across interaction modes ('buy', 'adopt', 'collab').
 * 3. Never returns sold, filled, or archived projects.
 */
export async function getFeatured(sourceProjects?: Project[]): Promise<Project[]> {
  let livePool: Project[] = [];

  if (sourceProjects && sourceProjects.length > 0) {
    livePool = sourceProjects.filter(
      (p) => !p.is_sold && !p.is_collab_filled && !p.is_archived
    );
  } else {
    const { data, error } = await supabase
      .from('projects')
      .select('*, seller:profiles(*)')
      .eq('is_sold', false)
      .eq('is_collab_filled', false)
      .eq('is_archived', false)
      .order('is_featured', { ascending: false })
      .order('featured_rank', { ascending: true, nullsFirst: false })
      .order('views', { ascending: false })
      .limit(30);

    if (!error && data) {
      livePool = data as unknown as Project[];
    }
  }

  // 1. Explicitly featured projects
  const explicitlyFeatured = livePool
    .filter((p) => p.is_featured)
    .sort((a, b) => (a.featured_rank ?? 999) - (b.featured_rank ?? 999));

  const result: Project[] = [...explicitlyFeatured.slice(0, 3)];
  const selectedIds = new Set(result.map((p) => p.id));

  // 2. If fewer than 3, fill with diverse high-view live listings
  if (result.length < 3) {
    const remainingNeeded = 3 - result.length;
    const available = livePool
      .filter((p) => !selectedIds.has(p.id))
      .sort((a, b) => (b.views || 0) - (a.views || 0));

    // Collect modes already present
    const existingModes = new Set(result.map((p) => p.interaction_type));
    const modes: InteractionType[] = ['buy', 'adopt', 'collab'];

    // First pass: try to pick an unrepresented mode with highest views
    for (const mode of modes) {
      if (result.length >= 3) break;
      if (!existingModes.has(mode)) {
        const candidate = available.find((p) => p.interaction_type === mode && !selectedIds.has(p.id));
        if (candidate) {
          result.push(candidate);
          selectedIds.add(candidate.id);
          existingModes.add(mode);
        }
      }
    }

    // Second pass: fill any remaining from available by highest views
    for (const p of available) {
      if (result.length >= 3) break;
      if (!selectedIds.has(p.id)) {
        result.push(p);
        selectedIds.add(p.id);
      }
    }
  }

  return result.slice(0, 3);
}

/**
 * Synchronous variant to extract featured projects from a pre-loaded project array
 */
export function extractFeaturedFromList(projects: Project[]): Project[] {
  const livePool = projects.filter(
    (p) => !p.is_sold && !p.is_collab_filled && !p.is_archived
  );

  const explicitlyFeatured = livePool
    .filter((p) => p.is_featured)
    .sort((a, b) => (a.featured_rank ?? 999) - (b.featured_rank ?? 999));

  const result: Project[] = [...explicitlyFeatured.slice(0, 3)];
  const selectedIds = new Set(result.map((p) => p.id));

  if (result.length < 3) {
    const available = livePool
      .filter((p) => !selectedIds.has(p.id))
      .sort((a, b) => (b.views || 0) - (a.views || 0));

    const existingModes = new Set(result.map((p) => p.interaction_type));
    const modes: InteractionType[] = ['buy', 'adopt', 'collab'];

    for (const mode of modes) {
      if (result.length >= 3) break;
      if (!existingModes.has(mode)) {
        const candidate = available.find((p) => p.interaction_type === mode && !selectedIds.has(p.id));
        if (candidate) {
          result.push(candidate);
          selectedIds.add(candidate.id);
          existingModes.add(mode);
        }
      }
    }

    for (const p of available) {
      if (result.length >= 3) break;
      if (!selectedIds.has(p.id)) {
        result.push(p);
        selectedIds.add(p.id);
      }
    }
  }

  return result.slice(0, 3);
}
