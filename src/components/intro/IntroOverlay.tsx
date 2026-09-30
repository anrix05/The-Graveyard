'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SkullGraphic } from '@/components/brand/SkullMark';
import { setLenisPaused } from '@/components/motion/SmoothScroll';
import {
  INTRO_DESKTOP_DURATION_MS,
  INTRO_MOBILE_DURATION_MS,
  INTRO_SKIP_FADE_MS,
  markIntroSeen,
} from '@/lib/intro';

interface SliceConfig {
  x: number;
  width: number;
  offsetY: number;
  rotDeg: number;
  staggerMs: number;
}

// 6 slices with 0.15 subpixel overlap to prevent seam artifacts
const SLICES: SliceConfig[] = [
  { x: 0, width: 4.2, offsetY: -56, rotDeg: -3.5, staggerMs: 140 },
  { x: 3.9, width: 4.3, offsetY: 36, rotDeg: 3.0, staggerMs: 70 },
  { x: 7.9, width: 4.3, offsetY: -24, rotDeg: -2.0, staggerMs: 0 },
  { x: 11.9, width: 4.3, offsetY: 24, rotDeg: 2.0, staggerMs: 0 },
  { x: 15.9, width: 4.3, offsetY: -36, rotDeg: -3.0, staggerMs: 70 },
  { x: 19.9, width: 4.2, offsetY: 56, rotDeg: 3.5, staggerMs: 140 },
];

// 13 static drifting dots for High tier
const DRIFTING_DOTS = [
  { id: 1, top: '15%', left: '12%', size: 3, opacity: 0.14, dur: '18s', delay: '0s' },
  { id: 2, top: '22%', left: '78%', size: 2, opacity: 0.18, dur: '22s', delay: '-3s' },
  { id: 3, top: '38%', left: '25%', size: 3.5, opacity: 0.12, dur: '20s', delay: '-6s' },
  { id: 4, top: '48%', left: '85%', size: 2, opacity: 0.20, dur: '25s', delay: '-1s' },
  { id: 5, top: '65%', left: '15%', size: 4, opacity: 0.15, dur: '19s', delay: '-8s' },
  { id: 6, top: '75%', left: '70%', size: 2.5, opacity: 0.16, dur: '23s', delay: '-4s' },
  { id: 7, top: '82%', left: '35%', size: 3, opacity: 0.12, dur: '21s', delay: '-7s' },
  { id: 8, top: '18%', left: '45%', size: 2, opacity: 0.15, dur: '26s', delay: '-2s' },
  { id: 9, top: '29%', left: '60%', size: 3, opacity: 0.17, dur: '17s', delay: '-5s' },
  { id: 10, top: '55%', left: '40%', size: 2.5, opacity: 0.13, dur: '24s', delay: '-9s' },
  { id: 11, top: '70%', left: '52%', size: 3.5, opacity: 0.19, dur: '19s', delay: '-3s' },
  { id: 12, top: '88%', left: '80%', size: 2, opacity: 0.14, dur: '22s', delay: '-11s' },
  { id: 13, top: '12%', left: '90%', size: 3, opacity: 0.16, dur: '20s', delay: '-4s' },
];

export default function IntroOverlay() {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [isHighTier, setIsHighTier] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const skullContainerRef = useRef<HTMLDivElement>(null);
  const slicesLayerRef = useRef<SVGGElement | null>(null);
  const masterSkullRef = useRef<SVGGElement | null>(null);
  const slicesRef = useRef<(SVGGElement | null)[]>([]);
  const eyeFlashRef = useRef<SVGGElement | null>(null);

  const hasStartedRef = useRef(false);
  const isFinishedRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);

  // Finish and cleanup callback
  const completeIntro = useCallback((isSkip = false) => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    // Clear all scheduled timeouts
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];

    // Unlock scroll
    setLenisPaused(false);
    if (typeof document !== 'undefined') {
      document.body.style.removeProperty('overflow');

      // Remove inert from app root
      const appRoot = document.getElementById('app-root');
      if (appRoot) {
        appRoot.removeAttribute('inert');
      }

      // Set html dataset
      document.documentElement.dataset.intro = 'done';
    }
    markIntroSeen();

    if (isSkip && containerRef.current) {
      containerRef.current.style.transition = `opacity ${INTRO_SKIP_FADE_MS}ms ease-out`;
      containerRef.current.style.opacity = '0';
      window.setTimeout(() => {
        setIsPlaying(false);
        window.dispatchEvent(new Event('graveyard:intro-done'));
      }, INTRO_SKIP_FADE_MS);
    } else {
      setIsPlaying(false);
      window.dispatchEvent(new Event('graveyard:intro-done'));
    }
  }, []);

  // Fast skip handler (click, tap, Esc or any key)
  const handleUserSkip = useCallback(() => {
    if (isFinishedRef.current || !isPlaying) return;
    completeIntro(true);
  }, [completeIntro, isPlaying]);

  useEffect(() => {
    setMounted(true);

    const introState = document.documentElement.dataset.intro;
    if (introState !== 'play') {
      const appRoot = document.getElementById('app-root');
      if (appRoot) appRoot.removeAttribute('inert');
      return;
    }

    // React Strict Mode double-effect guard
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    setIsPlaying(true);

    // Lock body and Lenis scroll
    setLenisPaused(true);
    document.body.style.overflow = 'hidden';

    // Make app root inert during playback
    const appRoot = document.getElementById('app-root');
    if (appRoot) {
      appRoot.setAttribute('inert', '');
    }

    // Check tier and mobile viewport
    const tier = document.documentElement.dataset.perf || 'high';
    const isMobile = window.innerWidth < 640;
    const isHigh = tier === 'high' && !isMobile;
    setIsHighTier(isHigh);

    // Hard failsafe in JS (3.8s max) to guarantee unlock
    const hardFailsafe = window.setTimeout(() => {
      completeIntro(false);
    }, 3800);
    timeoutsRef.current.push(hardFailsafe);

    // Show skip hint after 600ms
    const hintTimer = window.setTimeout(() => {
      setShowSkipHint(true);
    }, 600);
    timeoutsRef.current.push(hintTimer);

    // Listeners for skip
    const onKeyDown = (_e: KeyboardEvent) => {
      handleUserSkip();
    };
    window.addEventListener('keydown', onKeyDown);

    // =========================================================================
    // EXECUTE CHOREOGRAPHED TIMELINE
    // =========================================================================
    const isShort = isMobile;
    const tAssembleStart = isShort ? 100 : 150;
    const tAssembleDuration = isShort ? 800 : 950;
    const tSettleStart = isShort ? 900 : 1100;
    const tIgniteStart = isShort ? 1200 : 1500;
    const tHoldStart = isShort ? 1550 : 1900;
    const tExitStart = isShort ? 1750 : 2200;
    const totalDuration = isShort ? INTRO_MOBILE_DURATION_MS : INTRO_DESKTOP_DURATION_MS;

    // STEP 2: ASSEMBLE (Slices animate from alternating offsets into place, dim grey -> white)
    const assembleTimer = window.setTimeout(() => {
      SLICES.forEach((slice, idx) => {
        const el = slicesRef.current[idx];
        if (!el) return;

        const delayMs = slice.staggerMs;
        const sliceTimer = window.setTimeout(() => {
          el.style.transition = `transform ${tAssembleDuration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${tAssembleDuration * 0.7}ms ease, stroke ${tAssembleDuration}ms ease`;
          el.style.transform = 'translate(0px, 0px) rotate(0deg)';
          el.style.opacity = '1';
          el.style.stroke = '#f2f2f2';
        }, delayMs);
        timeoutsRef.current.push(sliceTimer);
      });
    }, tAssembleStart);
    timeoutsRef.current.push(assembleTimer);

    // STEP 3: SETTLE (Seams seamlessly vanish into unified master skull; scale 0.96 -> 1)
    const settleTimer = window.setTimeout(() => {
      if (skullContainerRef.current) {
        skullContainerRef.current.style.transition = 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)';
        skullContainerRef.current.style.transform = 'scale(1)';
      }
      // Reveal seamless master skull in white, hide sliced pieces so NO seam lines exist
      if (masterSkullRef.current) {
        masterSkullRef.current.style.transition = 'opacity 250ms ease';
        masterSkullRef.current.style.opacity = '1';
        masterSkullRef.current.style.stroke = '#f2f2f2';
      }
      if (slicesLayerRef.current) {
        slicesLayerRef.current.style.transition = 'opacity 250ms ease';
        slicesLayerRef.current.style.opacity = '0';
      }
    }, tSettleStart);
    timeoutsRef.current.push(settleTimer);

    // STEP 4: IGNITE ("Resurrection" moment: white -> brand red #ff2a2a, quick clean eye flash)
    const igniteTimer = window.setTimeout(() => {
      // Transition seamless skull to brand red #ff2a2a
      if (masterSkullRef.current) {
        masterSkullRef.current.style.transition = 'stroke 300ms ease';
        masterSkullRef.current.style.stroke = '#ff2a2a';
      }
      if (skullContainerRef.current) {
        skullContainerRef.current.style.transition = 'color 300ms ease';
        skullContainerRef.current.style.color = '#ff2a2a';
      }

      // Crisp 250ms neon green flash inside eye sockets, then cleanly disappears
      if (eyeFlashRef.current) {
        eyeFlashRef.current.style.transition = 'opacity 150ms ease';
        eyeFlashRef.current.style.opacity = '1';

        const fadeEyeTimer = window.setTimeout(() => {
          if (eyeFlashRef.current) {
            eyeFlashRef.current.style.transition = 'opacity 250ms ease-out';
            eyeFlashRef.current.style.opacity = '0';
          }
        }, 250);
        timeoutsRef.current.push(fadeEyeTimer);
      }
    }, tIgniteStart);
    timeoutsRef.current.push(igniteTimer);

    // STEP 5: HOLD (2% scale pulse hold)
    const holdTimer = window.setTimeout(() => {
      if (skullContainerRef.current) {
        skullContainerRef.current.style.transition = 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        skullContainerRef.current.style.transform = 'scale(1.02)';
      }
    }, tHoldStart);
    timeoutsRef.current.push(holdTimer);

    // STEP 6: EXIT (FLIP flight of the pure red brand logo to navbar)
    const exitTimer = window.setTimeout(() => {
      const introSkull = skullContainerRef.current;
      const overlay = containerRef.current;
      const targetLogo = document.querySelector('[data-intro-target="logo"]');

      if (introSkull && overlay && targetLogo) {
        const skullRect = introSkull.getBoundingClientRect();
        const targetRect = targetLogo.getBoundingClientRect();

        const dx = targetRect.left + targetRect.width / 2 - (skullRect.left + skullRect.width / 2);
        const dy = targetRect.top + targetRect.height / 2 - (skullRect.top + skullRect.height / 2);
        const scaleRatio = targetRect.width / (skullRect.width || 1);

        // Smooth flight FLIP
        introSkull.style.willChange = 'transform';
        introSkull.style.transition = 'transform 700ms cubic-bezier(0.65, 0, 0.35, 1)';
        introSkull.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleRatio})`;

        // Fade overlay background to transparent
        overlay.style.transition = 'background-color 600ms ease-out, opacity 600ms ease-out';
        overlay.style.backgroundColor = 'transparent';
        overlay.style.opacity = '0';
      } else if (introSkull && overlay) {
        // Fallback exit
        introSkull.style.transition = 'transform 600ms ease, opacity 600ms ease';
        introSkull.style.transform = 'scale(0.8)';
        introSkull.style.opacity = '0';
        overlay.style.transition = 'opacity 600ms ease';
        overlay.style.opacity = '0';
      }
    }, tExitStart);
    timeoutsRef.current.push(exitTimer);

    // STEP 7: COMPLETE
    const completeTimer = window.setTimeout(() => {
      completeIntro(false);
    }, totalDuration);
    timeoutsRef.current.push(completeTimer);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      if (!isFinishedRef.current) {
        hasStartedRef.current = false;
      }
    };
  }, [completeIntro, handleUserSkip]);

  // Don't render client DOM if finished or SSR not marked play
  if (mounted && !isPlaying) {
    return null;
  }

  return (
    <div
      id="intro-root"
      ref={containerRef}
      role="presentation"
      aria-hidden="true"
      onClick={handleUserSkip}
      className="fixed inset-0 z-[100] cursor-pointer select-none bg-[#050505] overflow-hidden"
    >
      {/* Soft Center Vignette (6% subtle red ambient center glow, no canvas, no blur filters) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 42, 42, 0.06) 0%, rgba(5, 5, 5, 0.95) 70%, #050505 100%)',
        }}
      />

      {/* High Tier Only: 13 Dim Drifting Dots (CSS transforms only, no blur) */}
      {isHighTier && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {DRIFTING_DOTS.map((dot) => (
            <div
              key={dot.id}
              className="absolute rounded-full bg-white animate-intro-drift"
              style={{
                top: dot.top,
                left: dot.left,
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                opacity: dot.opacity,
                animationDuration: dot.dur,
                animationDelay: dot.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Assembly Skull Hero Container */}
      <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
        <div
          ref={skullContainerRef}
          className="relative flex items-center justify-center text-[#4a4a4a]"
          style={{
            width: 'clamp(140px, 18vmin, 240px)',
            height: 'clamp(140px, 18vmin, 240px)',
            transform: 'scale(0.96)',
            transformOrigin: 'center center',
          }}
        >
          {/* Base SVG with viewBox 0 0 24 24 */}
          <svg
            viewBox="0 0 24 24"
            className="w-full h-full overflow-visible"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              {/* 6 Equal-Width Vertical Slice ClipPaths with slight subpixel overlap */}
              {SLICES.map((slice, idx) => (
                <clipPath key={`clip-${idx}`} id={`slice-clip-${idx}`}>
                  <rect x={slice.x} y="0" width={slice.width} height="24" />
                </clipPath>
              ))}
            </defs>

            {/* Seamless Master Skull (fades in at settle to completely eliminate slice lines) */}
            <g
              ref={masterSkullRef}
              style={{
                opacity: 0,
                stroke: '#f2f2f2',
              }}
            >
              <SkullGraphic />
            </g>

            {/* Slices Layer: active during assembly */}
            <g ref={slicesLayerRef}>
              {SLICES.map((slice, idx) => (
                <g
                  key={`slice-group-${idx}`}
                  ref={(el) => {
                    slicesRef.current[idx] = el;
                  }}
                  clipPath={`url(#slice-clip-${idx})`}
                  style={{
                    transform: `translate(0px, ${slice.offsetY}px) rotate(${slice.rotDeg}deg)`,
                    transformOrigin: '12px 12px',
                    opacity: 0,
                    stroke: '#4a4a4a',
                  }}
                >
                  <SkullGraphic />
                </g>
              ))}
            </g>

            {/* Temporary Neon Green Flash during Ignition (crisp, fades away before exit) */}
            <g
              ref={eyeFlashRef}
              style={{
                opacity: 0,
                pointerEvents: 'none',
              }}
            >
              <circle cx="9" cy="12" r="1" fill="#39ff14" stroke="#39ff14" strokeWidth="0.5" />
              <circle cx="15" cy="12" r="1" fill="#39ff14" stroke="#39ff14" strokeWidth="0.5" />
              <path d="m12.5 17-.5-1-.5 1h1z" fill="#39ff14" stroke="#39ff14" strokeWidth="0.5" />
            </g>
          </svg>
        </div>
      </div>

      {/* Skip Hint (Appears after 600ms bottom-right) */}
      <div
        className={`absolute bottom-6 right-8 z-20 pointer-events-auto transition-opacity duration-300 font-mono text-xs text-muted/70 hover:text-white uppercase tracking-wider ${
          showSkipHint ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span>Skip [Esc]</span>
      </div>
    </div>
  );
}
