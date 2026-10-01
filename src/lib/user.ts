/**
 * Helper to get consistent display handle across the application.
 * Never build `@${...}` by hand in components.
 */
export function getDisplayHandle(
  profile?: { username?: string | null; email?: string | null } | null | string
): string {
  if (!profile) return '@operative';

  if (typeof profile === 'string') {
    const trimmed = profile.trim();
    if (!trimmed) return '@operative';
    const clean = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
    return `@${clean || 'operative'}`;
  }

  if (profile.username) {
    const trimmed = profile.username.trim();
    const clean = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
    return `@${clean || 'operative'}`;
  }

  if (profile.email) {
    const name = profile.email.split('@')[0]?.trim();
    return `@${name || 'operative'}`;
  }

  return '@operative';
}

/**
 * Returns raw username without the `@` prefix.
 */
export function getRawUsername(
  profile?: { username?: string | null; email?: string | null } | null | string
): string {
  const handle = getDisplayHandle(profile);
  return handle.startsWith('@') ? handle.slice(1) : handle;
}
