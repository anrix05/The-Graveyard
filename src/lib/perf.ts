export type PerfTier = 'high' | 'mid' | 'low';
export type HeroFxMode = 'canvas-desktop' | 'canvas-mobile' | 'css' | 'static';

const STORAGE_KEY = 'graveyard_perf_tier';
export const HERO_FX_STORAGE_KEY = 'graveyard_hero_fx_override';
export const HERO_FX_DOWNGRADE_KEY = 'graveyard_hero_fx_downgrade';

/**
 * Evaluates static device and connection signals to determine base performance tier.
 * v2.7 Rule: coarse pointer or small viewport no longer forces 'low'.
 */
export function getInitialPerfTier(): PerfTier {
  if (typeof window === 'undefined') return 'high';

  // Check manual override from env or storage
  const forcedEnv = process.env.NEXT_PUBLIC_PERF_FORCE as PerfTier | undefined;
  if (forcedEnv && ['high', 'mid', 'low'].includes(forcedEnv)) {
    return forcedEnv;
  }

  try {
    const cached = sessionStorage.getItem(STORAGE_KEY) as PerfTier | null;
    if (cached && ['high', 'mid', 'low'].includes(cached)) {
      return cached;
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }

  // 1. Reduced motion preference -> low
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'low';
  }

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };

  // 2. Network Save-Data or slow 2g -> low
  if (nav.connection?.saveData || nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g') {
    return 'low';
  }

  // 3. Hardware constraints
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory || 8;

  if (cores <= 2 || memory <= 2) {
    return 'low';
  }

  // 4. Coarse pointer or modest hardware -> mid
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  if (isCoarse || cores <= 4 || memory <= 4) {
    return 'mid';
  }

  return 'high';
}

/**
 * Initializes runtime FPS benchmark during idle to detect laggy hardware.
 * Upgrades mid -> high only on desktop, never on touch/coarse.
 */
export function startPerfBenchmark(onTierChange: (tier: PerfTier) => void) {
  if (typeof window === 'undefined') return () => {};

  // Skip auto-downgrade in development mode unless explicitly testing
  if (process.env.NODE_ENV === 'development' && !sessionStorage.getItem('graveyard_test_governor')) {
    return () => {};
  }

  let cancelled = false;
  let idleId: number | NodeJS.Timeout | null = null;
  let introDoneListener: (() => void) | null = null;

  const runBenchmark = () => {
    if (cancelled) return;

    const idleCallback = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1000));

    idleId = idleCallback(() => {
      if (cancelled) return;

      let frames = 0;
      let lastTime = performance.now();
      const frameTimes: number[] = [];
      const maxFrames = 90; // ~1.5s at 60fps

      function measure(time: number) {
        if (cancelled) return;
        const delta = time - lastTime;
        lastTime = time;

        if (frames > 0) {
          frameTimes.push(delta);
        }
        frames++;

        if (frames < maxFrames) {
          requestAnimationFrame(measure);
        } else {
          // Calculate median frame time
          frameTimes.sort((a, b) => a - b);
          const median = frameTimes[Math.floor(frameTimes.length / 2)];

          const currentTier = (document.documentElement.dataset.perf as PerfTier) || 'high';
          let newTier = currentTier;

          if (median > 34) {
            newTier = 'low';
          } else if (median > 24) {
            newTier = currentTier === 'high' ? 'mid' : 'low';
          } else if (median < 17 && currentTier === 'mid') {
            // Upgrade mid -> high only on desktop fine pointer
            const isTouch = window.matchMedia('(pointer: coarse)').matches;
            if (!isTouch) {
              newTier = 'high';
            }
          }

          if (newTier !== currentTier) {
            applyPerfTier(newTier);
            onTierChange(newTier);
          }
        }
      }

      requestAnimationFrame((t) => {
        lastTime = t;
        requestAnimationFrame(measure);
      });
    });
  };

  // If intro is actively playing, defer benchmark until graveyard:intro-done
  if (document.documentElement.dataset.intro === 'play') {
    introDoneListener = () => {
      window.removeEventListener('graveyard:intro-done', introDoneListener!);
      introDoneListener = null;
      runBenchmark();
    };
    window.addEventListener('graveyard:intro-done', introDoneListener, { once: true });
  } else {
    runBenchmark();
  }

  return () => {
    cancelled = true;
    if (introDoneListener) {
      window.removeEventListener('graveyard:intro-done', introDoneListener);
    }
    if (typeof window !== 'undefined' && window.cancelIdleCallback && typeof idleId === 'number') {
      window.cancelIdleCallback(idleId);
    } else if (idleId) {
      clearTimeout(idleId as NodeJS.Timeout);
    }
  };
}

/**
 * Applies tier to HTML dataset and caches in session storage.
 */
export function applyPerfTier(tier: PerfTier) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.perf = tier;
    try {
      sessionStorage.setItem(STORAGE_KEY, tier);
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Determines active Hero FX mode based on device, tier, reduced motion, battery, and overrides.
 */
export function getHeroFxMode(): HeroFxMode {
  if (typeof window === 'undefined') return 'canvas-desktop';

  // 1. Reduced motion ALWAYS forces static (cannot be overridden)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'static';
  }

  // 2. URL override: ?fx=canvas|css|static
  const params = new URLSearchParams(window.location.search);
  const fxParam = params.get('fx');
  if (fxParam === 'static') return 'static';
  if (fxParam === 'css') return 'css';
  if (fxParam === 'canvas') {
    const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
    return isMobile ? 'canvas-mobile' : 'canvas-desktop';
  }

  // 3. Env override: NEXT_PUBLIC_HERO_FX
  const envFx = process.env.NEXT_PUBLIC_HERO_FX;
  if (envFx === 'static') return 'static';
  if (envFx === 'css') return 'css';
  if (envFx === 'canvas') {
    const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
    return isMobile ? 'canvas-mobile' : 'canvas-desktop';
  }

  // 4. Session overrides (e.g. from preview switcher or self-protection downgrade)
  try {
    const sessionOverride = sessionStorage.getItem(HERO_FX_STORAGE_KEY) as HeroFxMode | null;
    if (sessionOverride && ['canvas-desktop', 'canvas-mobile', 'css', 'static'].includes(sessionOverride)) {
      return sessionOverride;
    }
    const sessionDowngrade = sessionStorage.getItem(HERO_FX_DOWNGRADE_KEY);
    if (sessionDowngrade === 'css') {
      return 'css';
    }
  } catch {
    // Ignore storage errors
  }

  // 5. Connection SaveData or slow 2G -> css
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData || nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g') {
    return 'css';
  }

  // 6. Battery state: level < 0.2 and not charging -> css
  if (typeof window !== 'undefined' && (window as unknown as { __graveyard_battery_low?: boolean }).__graveyard_battery_low) {
    return 'css';
  }

  // 7. Perf tier check: low tier -> css
  const tier = (document.documentElement.dataset.perf as PerfTier) || getInitialPerfTier();
  if (tier === 'low') {
    return 'css';
  }

  // 8. Mobile vs Desktop viewport & pointer
  const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
  if (isMobile) {
    return 'canvas-mobile';
  }

  return 'canvas-desktop';
}

/**
 * Initializes battery status listener. Fails open on Safari/browsers lacking Battery API.
 */
export function initBatteryMonitoring(onBatteryChange?: (isLow: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return () => {};

  const nav = navigator as Navigator & {
    getBattery?: () => Promise<{
      level: number;
      charging: boolean;
      addEventListener: (type: string, listener: () => void) => void;
      removeEventListener: (type: string, listener: () => void) => void;
    }>;
  };

  if (typeof nav.getBattery !== 'function') return () => {};

  let active = true;
  let batteryRef: {
    level: number;
    charging: boolean;
    addEventListener: (type: string, listener: () => void) => void;
    removeEventListener: (type: string, listener: () => void) => void;
  } | null = null;

  const update = () => {
    if (!active || !batteryRef) return;
    const isLow = batteryRef.level < 0.2 && !batteryRef.charging;
    (window as unknown as { __graveyard_battery_low?: boolean }).__graveyard_battery_low = isLow;
    if (onBatteryChange) {
      onBatteryChange(isLow);
    }
  };

  nav.getBattery().then((battery) => {
    if (!active) return;
    batteryRef = battery;
    update();
    battery.addEventListener('levelchange', update);
    battery.addEventListener('chargingchange', update);
  }).catch(() => {
    // Fail open
  });

  return () => {
    active = false;
    if (batteryRef) {
      batteryRef.removeEventListener('levelchange', update);
      batteryRef.removeEventListener('chargingchange', update);
    }
  };
}

/**
 * Helper to manually override hero FX mode (for design system live preview).
 */
export function setHeroFxModeOverride(mode: HeroFxMode | 'auto') {
  if (typeof window === 'undefined') return;
  try {
    if (mode === 'auto') {
      sessionStorage.removeItem(HERO_FX_STORAGE_KEY);
      sessionStorage.removeItem(HERO_FX_DOWNGRADE_KEY);
    } else {
      sessionStorage.setItem(HERO_FX_STORAGE_KEY, mode);
    }
    window.dispatchEvent(new Event('graveyard:herofx-change'));
  } catch {
    // Ignore storage errors
  }
}
