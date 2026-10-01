/**
 * Open-redirect protection and safe intent utilities (v2.4).
 * Ensures post-auth redirects strictly resolve to relative same-origin paths.
 */

export const ALLOWED_INTENTS = ['buy', 'claim', 'apply', 'message'] as const;
export type SafeIntent = (typeof ALLOWED_INTENTS)[number];

export const DEFAULT_AUTH_REDIRECT = '/dashboard';

/**
 * Sanitizes and validates a post-authentication redirect path.
 * Strictly permits only relative same-origin paths starting with a single '/'.
 * Rejects protocol-relative ('//'), backslashes ('\\', '/\\'), URL schemes,
 * and dangerous encoded variations ('%2f', '%5c').
 *
 * @param next Raw 'next' query parameter or redirect string
 * @param fallback Fallback path if 'next' is invalid or missing (default: '/dashboard')
 */
export function getSafeNext(next: string | null | undefined, fallback: string = DEFAULT_AUTH_REDIRECT): string {
  if (!next || typeof next !== 'string') {
    return fallback;
  }

  const trimmed = next.trim();
  if (!trimmed) {
    return fallback;
  }

  // Reject URL encoded slashes or backslashes (%2f, %5c)
  if (/%2f|%5c/i.test(trimmed)) {
    return fallback;
  }

  // Reject paths with schemes (e.g. https://, http://, javascript:, data:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  // Reject protocol-relative or backslash-prefixed paths
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
    return fallback;
  }

  // Must begin with a single '/'
  if (!trimmed.startsWith('/') || trimmed.startsWith('///')) {
    return fallback;
  }

  // Reject whitespace or control characters
  if (/[\s\r\n\t]/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

/**
 * Validates and whitelists action intents.
 * Only 'buy', 'claim', 'apply', and 'message' are allowed; all others return null.
 */
export function getSafeIntent(intent: string | null | undefined): SafeIntent | null {
  if (!intent || typeof intent !== 'string') {
    return null;
  }

  const normalized = intent.trim().toLowerCase();
  if (normalized === 'adopt') {
    return 'claim';
  }
  if (ALLOWED_INTENTS.includes(normalized as SafeIntent)) {
    return normalized as SafeIntent;
  }

  return null;
}

/**
 * Constructs a safe post-login URL combining sanitized 'next' and optional 'intent'.
 */
export function buildPostAuthUrl(next: string | null | undefined, intent: string | null | undefined): string {
  const safeNext = getSafeNext(next);
  const safeIntent = getSafeIntent(intent);

  if (!safeIntent) {
    return safeNext;
  }

  const separator = safeNext.includes('?') ? '&' : '?';
  return `${safeNext}${separator}intent=${safeIntent}`;
}
