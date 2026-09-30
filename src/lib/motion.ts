import { useState, useEffect } from 'react';
import type { Variants } from 'framer-motion';

export const motionTokens = {
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
  durations: {
    micro: 0.15,
    base: 0.3,
    reveal: 0.7,
    hero: 1.1,
  },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.durations.reveal,
      ease: motionTokens.easeOutExpo,
    },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: motionTokens.durations.base,
      ease: 'easeOut',
    },
  },
};

export const staggerContainerVariants = (staggerChildren = 0.06): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren: 0.05,
    },
  },
});

/**
 * Checks whether user prefers reduced motion.
 * Returns false if reduced motion is requested.
 */
export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setAllowed(!mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setAllowed(!e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return allowed;
}

/**
 * Checks if the user is using a fine pointer device (mouse / trackpad) that supports hover.
 */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    setFine(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setFine(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return fine;
}
