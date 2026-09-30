'use client';

import { useState, useEffect } from 'react';

/**
 * React hook that returns true when the intro animation has completed or was skipped.
 * Returns true immediately if document.documentElement.dataset.intro !== 'play'.
 */
export function useIntroDone(): boolean {
  const [isDone, setIsDone] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.dataset.intro !== 'play';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (document.documentElement.dataset.intro !== 'play') {
      setIsDone(true);
      return;
    }

    const onIntroDone = () => {
      setIsDone(true);
    };

    window.addEventListener('graveyard:intro-done', onIntroDone, { once: true });
    return () => {
      window.removeEventListener('graveyard:intro-done', onIntroDone);
    };
  }, []);

  return isDone;
}

export default useIntroDone;
