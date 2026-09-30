'use client';

import { useState, useEffect } from 'react';
import { PerfTier, getInitialPerfTier, startPerfBenchmark, applyPerfTier } from '@/lib/perf';

export function usePerfTier(): {
  tier: PerfTier;
  setTier: (tier: PerfTier) => void;
  isHigh: boolean;
  isMid: boolean;
  isLow: boolean;
} {
  const [tier, setTierState] = useState<PerfTier>('high');

  useEffect(() => {
    const initial = getInitialPerfTier();
    setTierState(initial);
    applyPerfTier(initial);

    const cleanup = startPerfBenchmark((updatedTier) => {
      setTierState(updatedTier);
    });

    return cleanup;
  }, []);

  const setTier = (newTier: PerfTier) => {
    setTierState(newTier);
    applyPerfTier(newTier);
  };

  return {
    tier,
    setTier,
    isHigh: tier === 'high',
    isMid: tier === 'mid',
    isLow: tier === 'low',
  };
}

export default usePerfTier;
