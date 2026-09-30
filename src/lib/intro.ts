/**
 * THE GRAVEYARD - Intro Animation Configuration & Utilities (v2.3)
 * Controls playback conditions, storage scopes, and runtime coordination.
 */

export type IntroScope = 'session' | 'local' | 'always';

export const INTRO_STORAGE_KEY = 'graveyard:intro:v1';
export const INTRO_LOCAL_TIMESTAMP_KEY = 'graveyard:intro:ts';
export const INTRO_SCOPE: IntroScope = 'session';
export const INTRO_LOCAL_EXPIRY_DAYS = 7;
export const INTRO_ENABLED_ROUTES = ['/'];

// Total duration constants (in ms)
export const INTRO_DESKTOP_DURATION_MS = 3000;
export const INTRO_MOBILE_DURATION_MS = 2400;
export const INTRO_SKIP_FADE_MS = 250;
export const INTRO_FAILSAFE_MS = 4000;

/**
 * Checks if the intro should play according to route, device constraints, and storage.
 * Designed to be runnable both on client and inside inline head script.
 */
export function shouldPlayIntro(pathname?: string, search?: string): boolean {
  if (typeof window === 'undefined') return false;

  const currentPath = pathname ?? window.location.pathname;
  const currentSearch = search ?? window.location.search;
  const searchParams = new URLSearchParams(currentSearch);

  // 1. Force replay parameter
  if (searchParams.get('intro') === '1') {
    return true;
  }

  // 2. Force skip parameter
  if (searchParams.get('intro') === '0') {
    return false;
  }

  // 3. Route check: Only enabled routes (e.g. '/')
  const isEnabledRoute = INTRO_ENABLED_ROUTES.includes(currentPath);
  if (!isEnabledRoute) {
    return false;
  }

  // 4. Accessibility & Performance constraints
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  if (navigator.webdriver) {
    return false;
  }

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData) {
    return false;
  }

  if (document.documentElement.dataset.perf === 'low') {
    return false;
  }

  // 5. Storage Scope evaluation
  if (INTRO_SCOPE === 'always') {
    return true;
  }

  if (INTRO_SCOPE === 'session') {
    try {
      const seen = sessionStorage.getItem(INTRO_STORAGE_KEY);
      return !seen;
    } catch {
      return false;
    }
  }

  if (INTRO_SCOPE === 'local') {
    try {
      const seen = localStorage.getItem(INTRO_STORAGE_KEY);
      const timestampStr = localStorage.getItem(INTRO_LOCAL_TIMESTAMP_KEY);
      if (!seen || !timestampStr) return true;

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      const expiryMs = INTRO_LOCAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (now - timestamp > expiryMs) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Marks intro as seen immediately to avoid replay on rapid refresh or sub-page entry.
 */
export function markIntroSeen(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    if (INTRO_SCOPE === 'local') {
      localStorage.setItem(INTRO_STORAGE_KEY, '1');
      localStorage.setItem(INTRO_LOCAL_TIMESTAMP_KEY, Date.now().toString());
    }
  } catch {
    // Storage access may be restricted in sandboxes / private browsing
  }
}

/**
 * Clears flags and triggers a replay by navigating to /?intro=1.
 */
export function replayIntro(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(INTRO_STORAGE_KEY);
    localStorage.removeItem(INTRO_STORAGE_KEY);
    localStorage.removeItem(INTRO_LOCAL_TIMESTAMP_KEY);
  } catch {
    // Ignore storage errors
  }

  window.location.href = '/?intro=1';
}

/**
 * Returns raw JavaScript to run synchronously in <head> before first paint.
 * Ensures html[data-intro="play" | "skip"] is set with zero flash of unstyled content.
 */
export function getIntroHeadScript(): string {
  return `(function() {
    try {
      var path = window.location.pathname;
      var search = window.location.search;
      var isForce = search.indexOf('intro=1') !== -1;
      var isSkip = search.indexOf('intro=0') !== -1;
      var isHome = path === '/';
      var motionReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var webdriver = !!navigator.webdriver;
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      var saveData = !!(conn && conn.saveData);
      var perfLow = document.documentElement.dataset.perf === 'low';

      if (isSkip || motionReduce || webdriver || saveData || perfLow) {
        document.documentElement.dataset.intro = 'skip';
        return;
      }

      if (isForce) {
        document.documentElement.dataset.intro = 'play';
        try { sessionStorage.setItem('${INTRO_STORAGE_KEY}', '1'); } catch(e) {}
        return;
      }

      if (!isHome) {
        // If not home on first session visit, mark seen and skip
        try { sessionStorage.setItem('${INTRO_STORAGE_KEY}', '1'); } catch(e) {}
        document.documentElement.dataset.intro = 'skip';
        return;
      }

      var seen = false;
      try { seen = !!sessionStorage.getItem('${INTRO_STORAGE_KEY}'); } catch(e) {}

      if (!seen) {
        document.documentElement.dataset.intro = 'play';
        try { sessionStorage.setItem('${INTRO_STORAGE_KEY}', '1'); } catch(e) {}
      } else {
        document.documentElement.dataset.intro = 'skip';
      }
    } catch(err) {
      document.documentElement.dataset.intro = 'skip';
    }
  })();`;
}

