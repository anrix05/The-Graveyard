/**
 * Privacy-friendly, cookieless analytics event tracking.
 * Strictly NO PII: no emails, usernames, search text, or free-form user content.
 */

import { track as vercelTrack } from '@vercel/analytics';
import { IS_ANALYTICS_ENABLED } from '@/lib/env';

export const ANALYTICS_OPTOUT_KEY = 'graveyard:analytics:optout';

export type AnalyticsEvent =
  | { name: 'view_project'; props: { project_id: string; mode: string } }
  | { name: 'click_cta'; props: { action: 'buy' | 'claim' | 'apply' | 'list' | 'message'; project_id?: string } }
  | { name: 'checkout_started'; props: { project_id: string; price_band: string } }
  | { name: 'payment_succeeded'; props: { project_id: string; price_band: string } }
  | { name: 'payment_failed'; props: { project_id: string; reason_code?: string } }
  | { name: 'claim_completed'; props: { project_id: string } }
  | { name: 'collab_applied'; props: { project_id: string } }
  | { name: 'publish_started'; props?: Record<string, never> }
  | { name: 'publish_completed'; props: { mode: string; has_repo: boolean; has_archive: boolean } }
  | { name: 'signup_completed'; props: { method: 'email' | 'magic_link' | 'oauth' } }
  | { name: 'login_completed'; props: { method: 'email' | 'magic_link' | 'oauth' | 'demo' } }
  | { name: 'filter_used'; props: { filter_type: 'mode' | 'tech' | 'sort' | 'resurrected' } }
  | { name: 'search_used'; props: { length_bucket: 'short' | 'medium' | 'long' } }
  | { name: 'intro_replayed'; props?: Record<string, never> };

export function isAnalyticsOptedOut(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem(ANALYTICS_OPTOUT_KEY) === 'true') return true;
    if (navigator.doNotTrack === '1' || (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl) return true;
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return false;
}

export function setAnalyticsOptOut(optOut: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (optOut) {
      localStorage.setItem(ANALYTICS_OPTOUT_KEY, 'true');
    } else {
      localStorage.removeItem(ANALYTICS_OPTOUT_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function track<T extends AnalyticsEvent['name']>(
  name: T,
  props?: Extract<AnalyticsEvent, { name: T }>['props']
): void {
  if (!IS_ANALYTICS_ENABLED) return;
  if (isAnalyticsOptedOut()) return;

  try {
    vercelTrack(name, props);
  } catch (err) {
    // Fail silently in restricted environments
  }
}
