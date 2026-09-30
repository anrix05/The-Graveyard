'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getInitialPerfTier } from '@/lib/perf';

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);

  const ringRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const isVisibleRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tier = (document.documentElement.dataset.perf as 'high' | 'mid' | 'low') || getInitialPerfTier();
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Custom cursor only runs on high tier + fine pointer + motion allowed
    if (tier !== 'high' || !isFinePointer || prefersReducedMotion) {
      setEnabled(false);
      return;
    }

    setEnabled(true);

    let animId = 0;
    const lerp = 0.25;

    const onPointerMove = (e: PointerEvent) => {
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        currentPos.current.x = e.clientX;
        currentPos.current.y = e.clientY;
      }
    };

    const onPointerLeave = () => {
      isVisibleRef.current = false;
    };

    // Delegated pointerover for data-cursor attribute updates
    let currentLabel: string | null = null;
    const onPointerOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.('[data-cursor]');
      const nextLabel = target ? target.getAttribute('data-cursor') : null;
      if (nextLabel !== currentLabel) {
        currentLabel = nextLabel;
        setCursorLabel(nextLabel);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('pointerover', onPointerOver, { passive: true });

    // Single RAF loop reading mutable refs
    const loop = () => {
      animId = requestAnimationFrame(loop);

      if (!ringRef.current || !isVisibleRef.current) return;

      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * lerp;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * lerp;

      const x = Math.round(currentPos.current.x * 10) / 10;
      const y = Math.round(currentPos.current.y * 10) / 10;

      ringRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerover', onPointerOver);
    };
  }, []);

  if (!enabled) return null;

  const isExpanded = Boolean(cursorLabel);

  return (
    <div
      ref={ringRef}
      className={`fixed top-0 left-0 pointer-events-none z-50 transition-[width,height,background-color] duration-150 ease-out flex items-center justify-center ${
        isExpanded
          ? 'w-14 h-14 rounded-full bg-white text-[#0a0a0b] font-mono text-[11px] font-bold uppercase tracking-wider shadow-xl'
          : 'w-8 h-8 rounded-full border border-white/35'
      }`}
      style={{
        transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      {cursorLabel && <span>{cursorLabel}</span>}
    </div>
  );
}
