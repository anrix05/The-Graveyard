'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useIntroDone } from '@/hooks/useIntroDone';
import { useHeroFxMode } from '@/hooks/useHeroFxMode';
import { HERO_FX_DOWNGRADE_KEY } from '@/lib/perf';
import HeroFxCss from '@/components/hero/HeroFxCss';

interface SpriteGlyph {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  width: number;
  height: number;
  isEdgeWord: boolean;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  vy: number;
  swaySpeed: number;
  swayDist: number;
  swayOffset: number;
  glyphIndex: number;
  baseAlpha: number;
  alphaPulseSpeed: number;
  alphaPulseOffset: number;
}

interface MaskRect {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

/**
 * Box Signed Distance Field with corner radius r
 */
function sdRoundRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  radius: number
): number {
  const cx = rx + rw * 0.5;
  const cy = ry + rh * 0.5;
  const halfW = rw * 0.5;
  const halfH = rh * 0.5;
  const dx = Math.abs(px - cx) - (halfW - radius);
  const dy = Math.abs(py - cy) - (halfH - radius);
  const outsideDist = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - radius;
  const insideDist = Math.min(Math.max(dx, dy), 0) - radius;
  return outsideDist > 0 ? outsideDist : insideDist;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export default function SoulsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introDone = useIntroDone();
  const { mode, setMode } = useHeroFxMode();
  const [internalMode, setInternalMode] = useState(mode);

  // Sync internal mode with hook mode
  useEffect(() => {
    setInternalMode(mode);
  }, [mode]);

  // Downgrade to CSS if canvas loop detects frame drops
  const triggerSelfProtectionDowngrade = useCallback(() => {
    try {
      sessionStorage.setItem(HERO_FX_DOWNGRADE_KEY, 'css');
    } catch {
      // Ignore storage errors
    }
    setInternalMode('css');
    setMode('css');
  }, [setMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || !introDone) return;
    if (internalMode === 'static' || internalMode === 'css') return;

    const isMobileMode = internalMode === 'canvas-mobile';
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const container = canvas.parentElement || canvas;

    // ==========================================
    // 1. CONFIG & BUDGETS
    // ==========================================
    const targetFps = isMobileMode ? 24 : 30;
    const targetInterval = 1000 / targetFps;
    const dpr = isMobileMode ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.25);
    const maxAlphaCap = isMobileMode ? 0.30 : 0.35;
    const padding = isMobileMode ? 16 : 28;

    // ==========================================
    // 2. SPRITE ATLAS PRE-RENDERING
    // ==========================================
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = 512;
    atlasCanvas.height = 128;
    const atlasCtx = atlasCanvas.getContext('2d');
    if (!atlasCtx) return;

    const glyphDefs = [
      { text: '{', edge: false },
      { text: '}', edge: false },
      { text: '<', edge: false },
      { text: '/>', edge: false },
      { text: ';', edge: false },
      { text: '0', edge: false },
      { text: '1', edge: false },
      { text: 'null', edge: true },
      { text: 'void', edge: true },
    ];

    const fontSize = isMobileMode ? 17 : 13;
    atlasCtx.font = `500 ${fontSize}px ui-monospace, "Geist Mono", monospace`;
    atlasCtx.textBaseline = 'top';

    const spriteMap: SpriteGlyph[] = [];
    let currentAtlasX = 4;

    glyphDefs.forEach((g) => {
      const metrics = atlasCtx.measureText(g.text);
      const glyphWidth = Math.ceil(metrics.width) + 4;
      const glyphHeight = fontSize + 8;

      atlasCtx.fillStyle = '#ffffff';
      atlasCtx.fillText(g.text, currentAtlasX, 2);

      spriteMap.push({
        sx: currentAtlasX,
        sy: 0,
        sw: glyphWidth,
        sh: glyphHeight,
        width: glyphWidth,
        height: glyphHeight,
        isEdgeWord: g.edge,
      });

      currentAtlasX += glyphWidth + 8;
    });

    // ==========================================
    // 3. GEOMETRY & CACHED RECTANGLES (WORKSTREAM D)
    // ==========================================
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    let cachedRects: MaskRect[] = [];

    const updateMaskRects = () => {
      if (!container) return;
      const containerBox = container.getBoundingClientRect();
      const textElements = container.querySelectorAll<HTMLElement>('[data-hero-text]');
      const rects: MaskRect[] = [];

      textElements.forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return;
        rects.push({
          x: b.left - containerBox.left - padding,
          y: b.top - containerBox.top - padding,
          w: b.width + padding * 2,
          h: b.height + padding * 2,
          r: 12,
        });
      });

      cachedRects = rects;
    };

    const applySize = (w: number, h: number) => {
      width = w;
      height = h;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      updateMaskRects();
    };

    applySize(width, height);

    // Debounced resize: Only resize when width changes or height changes by > 120px
    let resizeTimer: NodeJS.Timeout | null = null;
    let lastRecordedWidth = width;
    let lastRecordedHeight = height;

    const handleContainerResize = () => {
      const curW = container.clientWidth || window.innerWidth;
      const curH = container.clientHeight || window.innerHeight;

      const widthDelta = Math.abs(curW - lastRecordedWidth);
      const heightDelta = Math.abs(curH - lastRecordedHeight);

      if (widthDelta > 1 || heightDelta > 120) {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          lastRecordedWidth = curW;
          lastRecordedHeight = curH;
          applySize(curW, curH);
        }, 150);
      } else {
        // Minor change: refresh mask rects without reallocating canvas
        updateMaskRects();
      }
    };

    const resizeObserver = new ResizeObserver(handleContainerResize);
    resizeObserver.observe(container);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateMaskRects).catch(() => {});
    }

    // ==========================================
    // 4. PARTICLES ALLOCATION & BUDGET
    // ==========================================
    const particleBudget = isMobileMode
      ? Math.min(26, Math.max(20, Math.round((width * height) / 18000)))
      : 55;

    const particles: Particle[] = new Array(particleBudget);
    for (let i = 0; i < particleBudget; i++) {
      const isEdgeOnly = Math.random() < 0.22;
      let glyphIndex: number;

      if (isEdgeOnly) {
        glyphIndex = 7 + (Math.random() > 0.5 ? 1 : 0);
      } else {
        glyphIndex = Math.floor(Math.random() * 7);
      }

      const x = isEdgeOnly
        ? Math.random() > 0.5
          ? Math.random() * (width * 0.22)
          : width * 0.78 + Math.random() * (width * 0.22)
        : Math.random() * width;

      const y = Math.random() * height;

      particles[i] = {
        x,
        y,
        baseX: x,
        vy: isMobileMode ? 0.16 + Math.random() * 0.22 : 0.22 + Math.random() * 0.35,
        swaySpeed: 0.0012 + Math.random() * 0.0018,
        swayDist: isMobileMode ? 8 + Math.random() * 12 : 12 + Math.random() * 20,
        swayOffset: Math.random() * Math.PI * 2,
        glyphIndex,
        baseAlpha: isMobileMode ? 0.10 + Math.random() * 0.18 : 0.12 + Math.random() * 0.22,
        alphaPulseSpeed: 0.001 + Math.random() * 0.0015,
        alphaPulseOffset: Math.random() * Math.PI * 2,
      };
    }

    // ==========================================
    // 5. TOUCH RIPPLE & POINTER TRACKING
    // ==========================================
    const mousePos = { x: -1000, y: -1000 };
    const touchRipple = { x: -1000, y: -1000, time: 0, active: false };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      if (e.pointerType === 'touch') {
        touchRipple.x = px;
        touchRipple.y = py;
        touchRipple.time = performance.now();
        touchRipple.active = true;
      } else {
        mousePos.x = px;
        mousePos.y = py;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        const rect = canvas.getBoundingClientRect();
        touchRipple.x = e.clientX - rect.left;
        touchRipple.y = e.clientY - rect.top;
        touchRipple.time = performance.now();
        touchRipple.active = true;
      }
    };

    const onPointerLeave = () => {
      mousePos.x = -1000;
      mousePos.y = -1000;
    };

    // Passive pointer listeners with touch-action: pan-y
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerdown', onPointerDown, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave, { passive: true });

    // ==========================================
    // 6. FRAME LOOP & SELF PROTECTION
    // ==========================================
    let animId = 0;
    let lastFrameTime = performance.now();
    let isVisible = true;
    let lastScrollY = window.scrollY;

    // Self-protection benchmark (first 2 seconds of mobile execution)
    let benchmarkFrames = 0;
    const benchmarkFrameDeltas: number[] = [];
    const maxBenchmarkFrames = 48; // ~2 seconds at 24fps

    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        lastFrameTime = performance.now();
        lastScrollY = window.scrollY;
      }
    });
    io.observe(canvas);

    const onVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
      if (isVisible) {
        lastFrameTime = performance.now();
        lastScrollY = window.scrollY;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const render = (time: number) => {
      animId = requestAnimationFrame(render);

      if (!isVisible) return;

      const delta = time - lastFrameTime;
      if (delta < targetInterval) return;
      lastFrameTime = time - (delta % targetInterval);

      // Mobile self-protection frame evaluation
      if (isMobileMode && benchmarkFrames < maxBenchmarkFrames) {
        benchmarkFrameDeltas.push(delta);
        benchmarkFrames++;
        if (benchmarkFrames === maxBenchmarkFrames) {
          benchmarkFrameDeltas.sort((a, b) => a - b);
          const medianDelta = benchmarkFrameDeltas[Math.floor(benchmarkFrameDeltas.length / 2)];
          if (medianDelta > 42) {
            triggerSelfProtectionDowngrade();
            return;
          }
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scroll response: subtle vertical nudge from scroll velocity
      const currentScrollY = window.scrollY;
      const scrollVelocity = Math.max(-10, Math.min(10, (currentScrollY - lastScrollY) * 0.22));
      lastScrollY = currentScrollY;

      // Touch ripple status (~600ms duration)
      const rippleElapsed = time - touchRipple.time;
      const isRippleActive = touchRipple.active && rippleElapsed < 600;
      const rippleProgress = isRippleActive ? rippleElapsed / 600 : 0;
      const rippleRadius = rippleProgress * 110;

      for (let i = 0; i < particleBudget; i++) {
        const p = particles[i];

        // Drift upwards + scroll velocity
        p.y -= p.vy + scrollVelocity * 0.2;
        p.x = p.baseX + Math.sin(time * p.swaySpeed + p.swayOffset) * p.swayDist;

        // Wrap around vertically
        if (p.y < -30) {
          p.y = height + 20;
          p.baseX = Math.random() * width;
        } else if (p.y > height + 30) {
          p.y = -20;
          p.baseX = Math.random() * width;
        }

        // Desktop mouse repulsion
        if (!isMobileMode) {
          const dx = p.x - mousePos.x;
          const dy = p.y - mousePos.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 10000 && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (100 - dist) / 100;
            p.x += (dx / dist) * force * 1.5;
          }
        }

        // Mobile touch ripple nudge
        if (isRippleActive) {
          const tdx = p.x - touchRipple.x;
          const tdy = p.y - touchRipple.y;
          const tdist = Math.hypot(tdx, tdy);
          const rippleDiff = Math.abs(tdist - rippleRadius);
          if (rippleDiff < 45 && tdist > 0) {
            const push = (1 - rippleDiff / 45) * (1 - rippleProgress) * 3.5;
            p.x += (tdx / tdist) * push;
            p.y += (tdy / tdist) * push;
          }
        }

        // ==========================================
        // DYNAMIC LEGIBILITY MASK (WORKSTREAM D)
        // ==========================================
        let minMaskDist = 9999;
        const rectCount = cachedRects.length;

        for (let r = 0; r < rectCount; r++) {
          const rect = cachedRects[r];
          const dist = sdRoundRect(p.x, p.y, rect.x, rect.y, rect.w, rect.h, rect.r);
          if (dist < minMaskDist) {
            minMaskDist = dist;
            if (minMaskDist <= 0) break; // Inside rect, completely obscured
          }
        }

        if (minMaskDist <= 0) {
          continue; // Fade to 0 inside any text or CTA bounds
        }

        // Smoothstep fade between 0px and 56px outside text block
        const legibilityFactor = smoothstep(0, 56, minMaskDist);
        if (legibilityFactor <= 0.02) continue;

        // Alpha pulsing: between 0.08 and 0.30
        const pulse = Math.sin(time * p.alphaPulseSpeed + p.alphaPulseOffset) * 0.5 + 0.5;
        const alpha = (0.08 + pulse * 0.22) * legibilityFactor;
        if (alpha <= 0.01) continue;

        const glyph = spriteMap[p.glyphIndex];

        ctx.globalAlpha = Math.min(alpha, maxAlphaCap);
        ctx.drawImage(
          atlasCanvas,
          glyph.sx,
          glyph.sy,
          glyph.sw,
          glyph.sh,
          Math.floor(p.x * dpr),
          Math.floor(p.y * dpr),
          glyph.sw * dpr,
          glyph.sh * dpr
        );
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      io.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [introDone, internalMode, triggerSelfProtectionDowngrade]);

  // Fallback states: static or CSS mode
  if (internalMode === 'static') {
    return <HeroFxCss isStatic={true} />;
  }

  if (internalMode === 'css') {
    return <HeroFxCss isStatic={false} />;
  }

  return (
    <>
      <div className="ambient-glow-red top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 select-none touch-pan-y"
        aria-hidden="true"
      />
    </>
  );
}
