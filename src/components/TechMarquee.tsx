'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useMotionAllowed } from '@/lib/motion';
import { CANONICAL_TECHS } from '@/types/project';

export default function TechMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const motionAllowed = useMotionAllowed();
  const techs = [...CANONICAL_TECHS, 'GraphQL', 'Prisma', 'Redis', 'WebSockets', 'TailwindCSS'];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlaying(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const tier = typeof document !== 'undefined' ? document.documentElement.dataset.perf : 'high';

  if (!motionAllowed || tier === 'low') {
    return (
      <div ref={containerRef} className="py-8 border-y border-line overflow-hidden contain-content-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-3">
          {techs.slice(0, 10).map((tech) => (
            <span
              key={tech}
              className="px-3.5 py-1.5 rounded-full bg-surface-2 border border-line text-xs font-mono text-muted"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full py-6 border-y border-line overflow-hidden group select-none contain-content-auto"
    >
      {/* Edge gradient fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg to-transparent z-10" />

      {/* Infinite Marquee Track with CSS Keyframes */}
      <div
        className="flex w-max tech-marquee-track group-hover:[animation-play-state:paused]"
        style={{
          animationPlayState: isPlaying ? 'running' : 'paused',
        }}
      >
        {/* Track 1 */}
        <div className="flex items-center gap-4 px-2">
          {techs.map((tech, idx) => (
            <span
              key={`t1-${idx}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-2/70 border border-line text-xs font-mono text-fg/80 hover:text-white hover:border-white/20 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              {tech}
            </span>
          ))}
        </div>

        {/* Duplicate Track 2 for seamless loop */}
        <div className="flex items-center gap-4 px-2" aria-hidden="true">
          {techs.map((tech, idx) => (
            <span
              key={`t2-${idx}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-2/70 border border-line text-xs font-mono text-fg/80 hover:text-white hover:border-white/20 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              {tech}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .tech-marquee-track {
          animation: marquee 35s linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
