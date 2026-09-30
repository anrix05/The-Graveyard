'use client';

import { useEffect } from 'react';

export default function MotionReady() {
  useEffect(() => {
    document.documentElement.setAttribute('data-motion-ready', 'true');
  }, []);

  return null;
}
