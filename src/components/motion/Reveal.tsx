'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Global shared IntersectionObserver instance
let sharedObserver: IntersectionObserver | null = null;
const callbacks = new Map<Element, () => void>();

function getObserver() {
  if (typeof window === 'undefined') return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cb = callbacks.get(entry.target);
            if (cb) {
              cb();
              callbacks.delete(entry.target);
              sharedObserver?.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.02 }
    );
  }
  return sharedObserver;
}

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export default function Reveal({
  children,
  className = '',
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isIn, setIsIn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if element is already in viewport or low tier
    const tier = document.documentElement.dataset.perf;
    if (tier === 'low') {
      setIsIn(true);
      return;
    }

    const obs = getObserver();
    if (!obs) {
      setIsIn(true);
      return;
    }

    callbacks.set(el, () => setIsIn(true));
    obs.observe(el);

    return () => {
      callbacks.delete(el);
      obs.unobserve(el);
    };
  }, []);

  // Cap max stagger delay to 300ms
  const cappedDelay = Math.min(delay, 0.3);

  return (
    <div
      ref={ref}
      className={cn('reveal-on-scroll', isIn && 'is-in', className)}
      style={{
        transitionDelay: `${cappedDelay}s`,
      }}
    >
      {children}
    </div>
  );
}
