'use client';

import React, { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useMotionAllowed, useFinePointer } from '@/lib/motion';

interface MagneticProps {
  children: React.ReactNode;
  maxDistance?: number;
  strength?: number;
  className?: string;
}

export default function Magnetic({
  children,
  maxDistance = 12,
  strength = 0.35,
  className = '',
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const motionAllowed = useMotionAllowed();
  const finePointer = useFinePointer();

  const x = useSpring(0, { stiffness: 250, damping: 20 });
  const y = useSpring(0, { stiffness: 250, damping: 20 });

  const tier = typeof document !== 'undefined' ? document.documentElement.dataset.perf : 'high';

  if (!motionAllowed || !finePointer || tier === 'mid' || tier === 'low') {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    const clampedX = Math.max(-maxDistance, Math.min(maxDistance, deltaX));
    const clampedY = Math.max(-maxDistance, Math.min(maxDistance, deltaY));

    x.set(clampedX);
    y.set(clampedY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}
