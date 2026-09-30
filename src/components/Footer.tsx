import React from 'react';
import Link from 'next/link';
import SkullMark from '@/components/brand/SkullMark';
import { replayIntro } from '@/lib/intro';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-line bg-bg pt-16 pb-8 relative z-10 overflow-hidden select-none contain-content-auto">
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
            <p className="font-sans text-sm text-muted leading-relaxed">
              The digital cemetery where abandoned codebases, prototypes, and side projects get resurrected into liquid software assets.
            </p>
          </div>

          {/* 3-Column Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">
            {/* Product */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
                Platform
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
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
                Legal
              </h4>
              <ul className="space-y-2 text-sm font-sans">
                <li>
                  <Link href="/terms" className="text-fg/80 hover:text-white transition-colors">
                    Terms of service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-fg/80 hover:text-white transition-colors">
                    Privacy policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
                Connect
              </h4>
              <ul className="space-y-2 text-sm font-sans">
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg/80 hover:text-white transition-colors"
                  >
                    GitHub repository
                  </a>
                </li>
                <li>
                  <span className="font-mono text-xs text-muted">v2.3.0</span>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => replayIntro()}
                    className="font-mono text-xs text-muted hover:text-brand-red transition-colors cursor-pointer text-left"
                  >
                    Replay intro ↺
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Slim Single-Line Test Mode Note (No box) */}
        <div className="pt-8 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted text-center sm:text-left">
          <span>Portfolio showcase · Razorpay test mode active · No real payments</span>
          <div className="flex items-center gap-4">
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

        {/* Giant Display Wordmark spanning width */}
        <div className="pt-6 overflow-hidden pointer-events-none select-none">
          <div className="font-display font-semibold text-[clamp(2.75rem,13vw,11.5rem)] tracking-tighter leading-none text-white/[0.04] text-center whitespace-nowrap translate-y-3 sm:translate-y-6">
            The Graveyard
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
