export type PerfTier = 'high' | 'mid' | 'low';

const STORAGE_KEY = 'graveyard_perf_tier';

/**
 * Evaluates static device and connection signals to determine base performance tier.
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

  // 2. Coarse pointer (mobile/tablets) -> mid
  if (window.matchMedia('(pointer: coarse)').matches) {
    return 'mid';
  }

  // 3. Network Save-Data -> low
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };

  if (nav.connection?.saveData || nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g') {
    return 'low';
  }

  // 4. Hardware constraints
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory || 8;

  if (cores <= 2 || memory <= 2) {
    return 'low';
  }

  if (cores <= 4 || memory <= 4) {
    return 'mid';
  }

  return 'high';
}

/**
 * Initializes runtime FPS benchmark during idle to detect laggy hardware.
 * In development, automatic FPS downgrade is skipped.
 */
export function startPerfBenchmark(onTierChange: (tier: PerfTier) => void) {
  if (typeof window === 'undefined') return () => {};

  // Skip auto-downgrade in development mode
  if (process.env.NODE_ENV === 'development') {
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
