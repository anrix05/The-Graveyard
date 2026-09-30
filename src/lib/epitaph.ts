import { Project, CAUSE_OF_DEATH_LABELS } from '@/types/project';

/**
 * Calculates a human-readable duration since a given date string.
 * Example: "1y 7m", "4m", "12d"
 */
export function formatDeadDuration(dateString?: string | null): string | null {
  if (!dateString) return null;
  const targetDate = new Date(dateString);
  if (isNaN(targetDate.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  if (diffMs <= 0) return null;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30.4375);
  const years = Math.floor(days / 365.25);

  if (years >= 1) {
    const remMonths = months % 12;
    return remMonths > 0 ? `${years}y ${remMonths}m` : `${years}y`;
  }
  if (months >= 1) {
    return `${months}m`;
  }
  return `${Math.max(1, days)}d`;
}

/**
 * Formats a project's tombstone line.
 * Example: "Died Mar 2024 · Lost interest · Dead for 1y 7m"
 * Never returns "Natural causes" or "undefined". If nothing remains, returns empty string.
 */
export function formatEpitaph(project: Partial<Project>): string {
  const parts: string[] = [];

  // 1. Death Date
  const dateSource = project.abandoned_on || project.last_commit_at;
  if (dateSource) {
    const d = new Date(dateSource);
    if (!isNaN(d.getTime())) {
      const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      parts.push(`Died ${monthYear}`);
    }
  }

  // 2. Cause of Death (Real causes only - never 'other' or 'Natural causes')
  if (
    project.cause_of_death &&
    project.cause_of_death !== 'other' &&
    CAUSE_OF_DEATH_LABELS[project.cause_of_death]
  ) {
    parts.push(CAUSE_OF_DEATH_LABELS[project.cause_of_death]!);
  }

  // 3. Duration dead
  if (dateSource) {
    const duration = formatDeadDuration(dateSource);
    if (duration) {
      parts.push(`Dead for ${duration}`);
    }
  }

  return parts.join(' · ');
}
