'use client';

import { useState, useEffect } from 'react';
import { HeroFxMode, getHeroFxMode, setHeroFxModeOverride, initBatteryMonitoring } from '@/lib/perf';

export function useHeroFxMode(): {
  mode: HeroFxMode;
  setMode: (mode: HeroFxMode | 'auto') => void;
} {
  const [mode, setModeState] = useState<HeroFxMode>(() => {
    if (typeof window === 'undefined') return 'canvas-desktop';
    return getHeroFxMode();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      setModeState(getHeroFxMode());
    };

    update();

    window.addEventListener('graveyard:herofx-change', update);
    window.addEventListener('resize', update);

    const mediaReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => update();
    if (mediaReducedMotion.addEventListener) {
      mediaReducedMotion.addEventListener('change', handleMotionChange);
    }

    const cleanupBattery = initBatteryMonitoring(() => {
      update();
    });

    return () => {
      window.removeEventListener('graveyard:herofx-change', update);
      window.removeEventListener('resize', update);
      if (mediaReducedMotion.removeEventListener) {
        mediaReducedMotion.removeEventListener('change', handleMotionChange);
      }
      cleanupBattery();
    };
  }, []);

  const setMode = (newMode: HeroFxMode | 'auto') => {
    setHeroFxModeOverride(newMode);
    setModeState(getHeroFxMode());
  };

  return {
    mode,
    setMode,
  };
}

export default useHeroFxMode;
