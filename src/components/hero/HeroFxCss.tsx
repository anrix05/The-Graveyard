'use client';

import React, { useRef, useEffect, useState } from 'react';

interface GlyphSpec {
  char: string;
  left: string;
  top: string;
  size: string;
  duration: string;
  delay: string;
  opacity: number;
}

// 10 glyphs strictly in outer safe zones (outer 18% sides and top/bottom bands)
const CSS_GLYPHS: GlyphSpec[] = [
  { char: '{', left: '4%', top: '22%', size: '1.25rem', duration: '18s', delay: '0s', opacity: 0.22 },
  { char: '}', left: '92%', top: '28%', size: '1.25rem', duration: '20s', delay: '-3s', opacity: 0.2 },
  { char: '/>', left: '6%', top: '65%', size: '1.1rem', duration: '22s', delay: '-6s', opacity: 0.18 },
  { char: ';', left: '94%', top: '72%', size: '1.35rem', duration: '16s', delay: '-2s', opacity: 0.22 },
  { char: '0', left: '10%', top: '42%', size: '1.15rem', duration: '24s', delay: '-8s', opacity: 0.16 },
  { char: '1', left: '88%', top: '50%', size: '1.15rem', duration: '19s', delay: '-5s', opacity: 0.18 },
  { char: 'null', left: '3%', top: '85%', size: '1.0rem', duration: '26s', delay: '-11s', opacity: 0.15 },
  { char: '{ }', left: '86%', top: '15%', size: '1.1rem', duration: '21s', delay: '-4s', opacity: 0.19 },
  { char: '<', left: '12%', top: '10%', size: '1.2rem', duration: '17s', delay: '-9s', opacity: 0.2 },
  { char: '1', left: '89%', top: '86%', size: '1.25rem', duration: '23s', delay: '-7s', opacity: 0.16 },
];

export default function HeroFxCss({ isStatic = false }: { isStatic?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {/* Ambient Red Glow with slow scale/translation */}
      <div
        className={`ambient-glow-red top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          !isStatic && isIntersecting ? 'animate-hero-glow-drift' : ''
        }`}
        style={{
          animationPlayState: isIntersecting ? 'running' : 'paused',
        }}
      />

      {/* Floating Glyphs (only when not static) */}
      {!isStatic && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            animationPlayState: isIntersecting ? 'running' : 'paused',
          }}
        >
          {CSS_GLYPHS.map((g, idx) => (
            <span
              key={idx}
              className="absolute font-mono text-white select-none pointer-events-none animate-hero-glyph-float"
              style={{
                left: g.left,
                top: g.top,
                fontSize: g.size,
                opacity: g.opacity,
                animationDuration: g.duration,
                animationDelay: g.delay,
                animationPlayState: isIntersecting ? 'running' : 'paused',
                willChange: isIntersecting ? 'transform, opacity' : 'auto',
              }}
            >
              {g.char}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
