'use client';

import React from 'react';
import Link from 'next/link';
import SkullMark from '@/components/brand/SkullMark';
import { replayIntro } from '@/lib/intro';
import { IS_ANALYTICS_CONFIGURED } from '@/lib/env';
import { openCookieSettings } from '@/lib/cookie-settings';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-line bg-bg pt-16 pb-8 safe-pb relative z-10 overflow-hidden select-none contain-content-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          {/* Brand & Wordmark */}
          <div className="space-y-3 max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5 whitespace-nowrap group">
              <SkullMark className="w-5 h-5 text-brand-red transition-transform group-hover:rotate-12 duration-200 shrink-0" />
              <span className="font-display font-semibold text-lg text-white group-hover:text-brand-red transition-colors whitespace-nowrap">
                The Graveyard
              </span>
            </Link>
            <p className="font-sans text-sm text-muted leading-relaxed break-anywhere">
              The digital cemetery where abandoned codebases, prototypes, and side projects get resurrected into liquid software assets.
            </p>
          </div>

          {/* 3-Column Navigation Grid - stack cleanly on very narrow screens */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 w-full md:w-auto">
            {/* Product */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
                Product
              </h4>
              <ul className="space-y-2 text-sm font-sans">
                <li>
                  <Link href="/" className="text-fg/80 hover:text-white transition-colors">
                    Browse codebases
                  </Link>
                </li>
                <li>
                  <Link href="/submit" className="text-fg/80 hover:text-white transition-colors">
                    Submit project
                  </Link>
                </li>
                <li>
                  <Link href="/design-system" className="text-fg/80 hover:text-white transition-colors">
                    Design system
                  </Link>
                </li>
                <li>
                  <Link href="/design-system/responsive" className="text-fg/80 hover:text-brand-red transition-colors inline-flex items-center gap-1.5">
                    <span>Responsive preview</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-red/10 text-brand-red border border-brand-red/20">v2.6</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
                Company
              </h4>
              <ul className="space-y-2 text-sm font-sans">
                <li>
                  <Link href="/contact" className="text-fg/80 hover:text-white transition-colors">
                    Contact &amp; Support
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/anrix05/The-Graveyard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg/80 hover:text-white transition-colors"
                  >
                    GitHub repository
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3 xs:col-span-2 sm:col-span-1">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
                Legal
              </h4>
              <ul className="space-y-2 text-sm font-sans">
                <li>
                  <Link href="/terms" className="text-fg/80 hover:text-white transition-colors">
                    Terms of use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-fg/80 hover:text-white transition-colors">
                    Privacy policy
                  </Link>
                </li>
                {IS_ANALYTICS_CONFIGURED && (
                  <li>
                    <button
                      type="button"
                      onClick={openCookieSettings}
                      className="text-fg/80 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      Cookie settings
                    </button>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={() => replayIntro()}
                    className="font-mono text-xs text-muted hover:text-brand-red transition-colors cursor-pointer text-left inline-flex items-center gap-1"
                  >
                    <span>Replay intro</span>
                    <span>↺</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Slim Single-Line Test Mode Note (Wraps gracefully on mobile) */}
        <div className="pt-8 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted text-center sm:text-left flex-wrap">
          <span className="break-words">Portfolio showcase · Razorpay test mode active · No real payments</span>
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => replayIntro()}
              className="text-muted/70 hover:text-white transition-colors underline underline-offset-4 decoration-line hover:decoration-white cursor-pointer"
            >
              Replay intro
            </button>
            <span>© 2026 The Graveyard. All rights reserved.</span>
          </div>
        </div>

        {/* Giant Display Wordmark spanning width with zero overflow */}
        <div className="pt-6 overflow-hidden pointer-events-none select-none w-full">
          <div className="font-display font-semibold text-[clamp(2rem,11.5vw,11.5rem)] tracking-tighter leading-none text-white/[0.04] text-center whitespace-nowrap translate-y-2 sm:translate-y-6 max-w-full">
            The Graveyard
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
