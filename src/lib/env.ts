/**
 * Centralized environment configuration for The Graveyard.
 * Never hardcode personal credentials or URLs in source files.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://graveyard.anrix.me'
    : 'http://localhost:3000');

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';

export const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/anrix05/The-Graveyard';

export const LINKEDIN_URL = process.env.NEXT_PUBLIC_LINKEDIN_URL || '';

// Config flag: is analytics feature enabled (default true; set NEXT_PUBLIC_ANALYTICS_ENABLED='false' to disable completely)
export const IS_ANALYTICS_CONFIGURED =
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false';

// Runtime flag: are analytics scripts actively transmitting to Vercel (production only and configured)
export const IS_ANALYTICS_ENABLED =
  IS_ANALYTICS_CONFIGURED && process.env.NODE_ENV === 'production';

