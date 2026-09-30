'use client';

import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { usePathname } from 'next/navigation';
import { getInitialPerfTier } from '@/lib/perf';

export function setLenisPaused(paused: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(paused ? 'graveyard:modal-open' : 'graveyard:modal-close'));
  }
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tier = (document.documentElement.dataset.perf as 'high' | 'mid' | 'low') || getInitialPerfTier();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Native scroll on low tier or reduced motion
    if (tier === 'low' || prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true,
    });
    lenisRef.current = lenis;

    const onModalOpen = () => lenis.stop();
    const onModalClose = () => lenis.start();

    window.addEventListener('graveyard:modal-open', onModalOpen);
    window.addEventListener('graveyard:modal-close', onModalClose);

    return () => {
      window.removeEventListener('graveyard:modal-open', onModalOpen);
      window.removeEventListener('graveyard:modal-close', onModalClose);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scroll to top immediately on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return <div className="overflow-x-clip min-h-screen">{children}</div>;
}
