'use client';

import React from 'react';
import { UploadCloud, Search, Flame } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';

const steps = [
  {
    num: '01',
    title: 'List the dormant codebase',
    subtitle: 'Upload your zip archive or connect your GitHub repository in 4 simple steps.',
    accent: '#ff2a2a',
    icon: UploadCloud,
    illustration: (
      <div className="relative w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-dashed border-red-500/20 animate-spin [animation-duration:20s]" />
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-surface-2 border border-line flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 text-center shadow-lg">
          <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 text-brand-red" />
          <span className="font-mono text-[9px] sm:text-[10px] text-muted uppercase">ARCHIVE.ZIP</span>
        </div>
      </div>
    ),
  },
  {
    num: '02',
    title: 'Discover & evaluate',
    subtitle: 'Developers browse live codebases, inspect commit tombstones, and test live demos.',
    accent: '#39ff14',
    icon: Search,
    illustration: (
      <div className="relative w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center">
        <div className="w-36 sm:w-40 h-24 sm:h-28 rounded-2xl bg-surface-2 border border-line flex flex-col justify-between p-3 sm:p-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-neon-green" />
            <span className="font-mono text-[9px] sm:text-[10px] text-neon-green">FOR SALE</span>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-3/4 bg-white/20 rounded-full" />
            <div className="h-2 w-1/2 bg-white/10 rounded-full" />
          </div>
          <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-mono text-muted">
            <span>Died Mar 2024</span>
            <span className="text-white font-bold">₹2,499</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: '03',
    title: 'Resurrect with full ownership',
    subtitle: 'One-click checkout dispatches repo collaborator invites and instant signed download URLs.',
    accent: '#3b82f6',
    icon: Flame,
    illustration: (
      <div className="relative w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-blue-500/10 border border-blue-500/30 flex flex-col items-center justify-center gap-1.5 sm:gap-2 shadow-glow-blue">
          <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-blue-accent animate-pulse" />
          <span className="font-mono text-[9px] sm:text-[10px] text-blue-400 font-bold uppercase">REVIVED</span>
        </div>
      </div>
    ),
  },
];

export default function HowItWorksStack() {
  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="mb-10 sm:mb-14 text-center max-w-xl mx-auto space-y-2.5 sm:space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-red font-semibold">
            // The Lifecycle
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white">
            How dead code gets revived
          </h2>
          <p className="text-muted text-sm sm:text-base">
            No friction, no corporate bureaucracy. Just engineers passing the torch.
          </p>
        </div>
      </Reveal>

      {/* Stacking Panels: sticky stack on both mobile and desktop */}
      <div className="space-y-6 sm:space-y-8 relative [--stack-top:4.25rem] [--stack-step:0.75rem] md:[--stack-top:5rem] md:[--stack-step:1.5rem]">
        {steps.map((step, idx) => (
          <div
            key={step.num}
            className="sticky rounded-[20px] bg-surface border border-line p-5 sm:p-8 md:p-12 shadow-2xl transition-all duration-300 max-h-none"
            style={{
              top: `calc(var(--stack-top) + ${idx} * var(--stack-step))`,
              zIndex: idx + 1,
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-center">
              <div className="space-y-2.5 sm:space-y-4">
                <span className="font-mono text-xs sm:text-sm font-bold text-muted">
                  STEP {step.num}
                </span>
                <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-semibold text-white break-anywhere">
                  {step.title}
                </h3>
                <p className="text-muted text-xs sm:text-base leading-relaxed max-w-md break-anywhere">
                  {step.subtitle}
                </p>
              </div>

              <div className="flex items-center justify-center md:justify-end pt-2 md:pt-0">
                {step.illustration}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
