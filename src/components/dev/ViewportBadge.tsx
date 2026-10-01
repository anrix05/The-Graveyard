'use client';

import React, { useEffect, useState } from 'react';
import { useHeroFxMode } from '@/hooks/useHeroFxMode';

export default function ViewportBadge() {
  const [dimensions, setDimensions] = useState<{ width: number; height: number; dpr: number }>({
    width: 0,
    height: 0,
    dpr: 1,
  });
  const [tier, setTier] = useState<string>('high');
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { mode: fxMode } = useHeroFxMode();

  useEffect(() => {
    setIsMounted(true);

    const isDev = process.env.NODE_ENV === 'development';
    const params = new URLSearchParams(window.location.search);
    const hasDebug = params.get('debug') === 'viewport' || params.has('debug');

    if (isDev || hasDebug) {
      setIsVisible(true);
    }

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: Math.round((window.devicePixelRatio || 1) * 10) / 10,
      });
      const currentTier = document.documentElement.dataset.perf || 'high';
      setTier(currentTier);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Toggle with Ctrl+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setIsVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isMounted || !isVisible) {
    return null;
  }

  const { width, height, dpr } = dimensions;

  // Determine active Tailwind breakpoint name
  let breakpoint = '<xs';
  if (width >= 2560) breakpoint = '4xl';
  else if (width >= 1920) breakpoint = '3xl';
  else if (width >= 1536) breakpoint = '2xl';
  else if (width >= 1280) breakpoint = 'xl';
  else if (width >= 1024) breakpoint = 'lg';
  else if (width >= 768) breakpoint = 'md';
  else if (width >= 640) breakpoint = 'sm';
  else if (width >= 380) breakpoint = 'xs';

  return (
    <div
      className="fixed bottom-3 left-3 z-[9999] pointer-events-none select-none rounded-full border border-white/20 bg-black/85 px-3 py-1 font-mono text-[11px] text-white shadow-xl backdrop-blur-md flex items-center gap-2"
      aria-hidden="true"
    >
      <span className="font-semibold text-brand-red">{breakpoint}</span>
      <span className="text-white/40">|</span>
      <span>
        {width}×{height}
      </span>
      <span className="text-white/40">|</span>
      <span className="text-muted">{dpr}x</span>
      <span className="text-white/40">|</span>
      <span className="text-[#39ff14] uppercase">{tier}</span>
      <span className="text-white/40">|</span>
      <span className="text-amber">{fxMode}</span>
    </div>
  );
}
