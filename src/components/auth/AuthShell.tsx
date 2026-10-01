'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, GitFork, ShieldCheck, Users } from 'lucide-react';
import SkullMark from '@/components/brand/SkullMark';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset' | 'verify' | 'onboarding';

export interface AuthShellProps {
  mode?: AuthMode;
  children: React.ReactNode;
  /** Optional custom headline for companion pages */
  customHeadline?: React.ReactNode;
}

// 8 tiny glyphs for high perf tier drifting animation (no canvas, no blur)
const DRIFTING_GLYPHS = [
  { char: '01', top: '18%', left: '14%', anim: 'animate-glyph-drift-1', opacity: 'opacity-20' },
  { char: '{ }', top: '28%', left: '82%', anim: 'animate-glyph-drift-2', opacity: 'opacity-15' },
  { char: 'λ', top: '44%', left: '12%', anim: 'animate-glyph-drift-2', opacity: 'opacity-20' },
  { char: ';', top: '56%', left: '86%', anim: 'animate-glyph-drift-1', opacity: 'opacity-25' },
  { char: '⚡', top: '68%', left: '22%', anim: 'animate-glyph-drift-1', opacity: 'opacity-15' },
  { char: '< />', top: '78%', left: '74%', anim: 'animate-glyph-drift-2', opacity: 'opacity-20' },
  { char: '⚰️', top: '88%', left: '32%', anim: 'animate-glyph-drift-2', opacity: 'opacity-15' },
  { char: '::', top: '34%', left: '65%', anim: 'animate-glyph-drift-1', opacity: 'opacity-20' },
];

export default function AuthShell({ mode = 'signin', children, customHeadline }: AuthShellProps) {
  const [resurrectedCount, setResurrectedCount] = useState<number | null>(14);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const { data, error } = await supabase.rpc('get_marketplace_stats');
        if (!error && data && isMounted) {
          const stats = data as { resurrected?: number };
          if (typeof stats.resurrected === 'number') {
            setResurrectedCount(stats.resurrected);
          }
        }
      } catch {
        // Fallback to initial 14
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const isSignUp = mode === 'signup';

  return (
    <div className="min-h-dvh w-full bg-[#0a0a0b] text-fg flex flex-col lg:flex-row antialiased selection:bg-brand-red selection:text-white">
      {/* =========================================================================
          LEFT BRAND PANEL (Desktop ≥ 1024px: 46% width, min-h-dvh, no outer boxes)
          Collapsed on mobile/tablet into a compact top band
          ========================================================================= */}
      
      {/* Mobile/Tablet Compact Top Band (< 1024px) */}
      <div className="lg:hidden w-full border-b border-line bg-[#0d0d0f]/90 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 rounded-lg"
          aria-label="The Graveyard - Home"
        >
          <SkullMark size={22} className="text-brand-red transition-transform group-hover:scale-105" />
          <span className="font-display font-semibold text-base tracking-tight text-white">
            The Graveyard
          </span>
        </Link>
        <span className="hidden sm:inline font-sans text-xs text-muted">
          {mode === 'signup'
            ? 'Give dead code a second life.'
            : 'Resurrect abandoned codebases.'}
        </span>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-sans text-muted hover:text-white transition-colors py-1.5 px-2 rounded-md hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to home</span>
        </Link>
      </div>

      {/* Desktop Left Brand Panel (≥ 1024px) */}
      <aside
        aria-label="Brand Overview"
        className="hidden lg:flex relative w-[46%] min-h-dvh flex-col justify-between p-12 xl:p-16 border-r border-line bg-[#0d0d0f] overflow-hidden select-none"
      >
        {/* Soft Red Ambient Radial Glow */}
        <div
          className="absolute -top-32 -left-32 w-[650px] h-[650px] pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 42, 42, 0.08) 0%, rgba(255, 42, 42, 0) 70%)',
          }}
          aria-hidden="true"
        />

        {/* Faint Dotted Grid Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />

        {/* Very Large Low-Opacity Skull Mark Background Art (cropped by panel edge) */}
        <div
          className="absolute -right-24 -bottom-24 w-[520px] h-[520px] text-white/[0.025] pointer-events-none"
          aria-hidden="true"
        >
          <SkullMark size="100%" className="w-full h-full" />
        </div>

        {/* High-Tier Drifting Glyphs (only active when data-perf="high", static on low/mid/reduced-motion) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {DRIFTING_GLYPHS.map((g, i) => (
            <span
              key={i}
              className={cn(
                'absolute font-mono text-xs text-muted/40 transition-transform duration-1000',
                g.opacity,
                g.anim
              )}
              style={{ top: g.top, left: g.left }}
            >
              {g.char}
            </span>
          ))}
        </div>

        {/* Brand Top: Skull Mark + Wordmark */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4 rounded-xl py-1"
          >
            <SkullMark size={28} className="text-brand-red transition-transform duration-300 group-hover:scale-105" />
            <span className="font-display font-semibold text-2xl tracking-tight text-white">
              The Graveyard
            </span>
          </Link>
        </div>

        {/* Brand Middle: Headline with Instrument Serif Italic Accent + 3-Item Benefit List */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          {/* Dynamic Headline with 200ms cross-fade */}
          <div className="min-h-[100px] flex items-center">
            {customHeadline ? (
              <h2 className="font-display text-3xl xl:text-4xl font-semibold tracking-tight text-white leading-snug">
                {customHeadline}
              </h2>
            ) : (
              <h2
                key={mode}
                className="font-display text-3xl xl:text-4xl font-semibold tracking-tight text-white leading-snug transition-opacity duration-200"
              >
                {isSignUp ? (
                  <>
                    Give your dead code a{' '}
                    <span className="font-accent italic text-[#ff2a2a] font-normal tracking-normal text-[1.12em]">
                      second life
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Welcome back to the{' '}
                    <span className="font-accent italic text-[#ff2a2a] font-normal tracking-normal text-[1.12em]">
                      graveyard
                    </span>
                    .
                  </>
                )}
              </h2>
            )}
          </div>

          {/* 3-Item Benefit List (No boxes, Lucide icons in soft circles) */}
          <ul className="mt-8 space-y-5" aria-label="Key Platform Features">
            <li className="flex items-center gap-3.5 text-muted hover:text-fg transition-colors">
              <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-emerald-400">
                <GitFork className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="font-sans text-sm xl:text-base font-normal">
                Claim free forks in one click
              </span>
            </li>
            <li className="flex items-center gap-3.5 text-muted hover:text-fg transition-colors">
              <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-[#fbbf24]">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="font-sans text-sm xl:text-base font-normal">
                Buy exclusive codebases (test-mode checkout)
              </span>
            </li>
            <li className="flex items-center gap-3.5 text-muted hover:text-fg transition-colors">
              <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-sky-400">
                <Users className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="font-sans text-sm xl:text-base font-normal">
                Find a co-founder for a stalled idea
              </span>
            </li>
          </ul>
        </div>

        {/* Brand Bottom Row: Real Telemetry + Supabase Auth Badge (NO fake telemetry) */}
        <div className="relative z-10 pt-6 border-t border-line/60 flex items-center justify-between text-xs font-mono text-muted/70">
          <div>
            {resurrectedCount !== null && (
              <span className="tabular-nums text-white/90">
                {resurrectedCount} codebases resurrected
              </span>
            )}
          </div>
          <div>
            <span>Powered by Supabase Auth</span>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT FORM PANEL (Desktop ≥ 1024px: 54% width, min-h-dvh, form max-w-[420px])
          Vertically and horizontally centered
          ========================================================================= */}
      <main className="w-full lg:w-[54%] min-h-dvh flex flex-col justify-center items-center px-6 sm:px-10 py-10 lg:py-16 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] relative overflow-y-auto">
        <div className="w-full max-w-[420px] flex flex-col my-auto">
          {/* Ghost Back Link inside content column at the top */}
          <div className="mb-6 lg:mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-sans text-muted hover:text-white transition-colors group focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 rounded-lg py-1 px-1 -ml-1"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              <span>Back to home</span>
            </Link>
          </div>

          {/* Form Content Mount */}
          {children}
        </div>
      </main>
    </div>
  );
}
