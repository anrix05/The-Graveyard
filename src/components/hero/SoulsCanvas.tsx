'use client';

import React, { useRef, useEffect } from 'react';
import { getInitialPerfTier } from '@/lib/perf';
import { useIntroDone } from '@/hooks/useIntroDone';

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
}

export default function SoulsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introDone = useIntroDone();

  useEffect(() => {
    if (typeof window === 'undefined' || !introDone) return;

    // Check perf tier and device capabilities
    const tier = (document.documentElement.dataset.perf as 'high' | 'mid' | 'low') || getInitialPerfTier();
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Zero particles on low tier, reduced motion, or mobile/coarse pointer
    if (tier === 'low' || prefersReducedMotion || isCoarse) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const particleBudget = tier === 'mid' ? 35 : 60;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

    // ==========================================
    // 1. OFFSCREEN SPRITE ATLAS PRE-RENDERING
    // ==========================================
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = 512;
    atlasCanvas.height = 128;
    const atlasCtx = atlasCanvas.getContext('2d');
    if (!atlasCtx) return;

    // Glyphs to render into atlas
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

    atlasCtx.font = '500 13px ui-monospace, "Geist Mono", monospace';
    atlasCtx.textBaseline = 'top';

    const spriteMap: SpriteGlyph[] = [];
    let currentAtlasX = 4;

    glyphDefs.forEach((g) => {
      const metrics = atlasCtx.measureText(g.text);
      const glyphWidth = Math.ceil(metrics.width) + 4;
      const glyphHeight = 20;

      // Draw text in pure white on transparent atlas
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
    // 2. CANVAS SIZING & PARTICLES ALLOCATION
    // ==========================================
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.parentElement.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    // Single pre-allocated particles array
    const particles: Particle[] = new Array(particleBudget);
    for (let i = 0; i < particleBudget; i++) {
      const isEdgeOnly = Math.random() < 0.2;
      let glyphIndex: number;

      if (isEdgeOnly) {
        // null or void
        glyphIndex = 7 + (Math.random() > 0.5 ? 1 : 0);
      } else {
        // frequent single characters
        glyphIndex = Math.floor(Math.random() * 7);
      }

      const x = isEdgeOnly
        ? Math.random() > 0.5
          ? Math.random() * (width * 0.25)
          : width * 0.75 + Math.random() * (width * 0.25)
        : Math.random() * width;

      const y = Math.random() * height;

      particles[i] = {
        x,
        y,
        baseX: x,
        vy: 0.2 + Math.random() * 0.35,
        swaySpeed: 0.0015 + Math.random() * 0.002,
        swayDist: 10 + Math.random() * 20,
        swayOffset: Math.random() * Math.PI * 2,
        glyphIndex,
        baseAlpha: 0.12 + Math.random() * 0.22,
      };
    }

    // Mutable mouse coordinates
    const mousePos = { x: -1000, y: -1000 };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mousePos.x = -1000;
      mousePos.y = -1000;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    // ==========================================
    // 3. FRAME LOOP WITH 30FPS CAP & LEGIBILITY MASK
    // ==========================================
    let animId = 0;
    let lastFrameTime = 0;
    const targetInterval = 1000 / 30; // 30fps cap
    let isVisible = true;

    // IntersectionObserver to pause loop when hero is off-screen
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    io.observe(canvas);

    const onVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const render = (time: number) => {
      animId = requestAnimationFrame(render);

      if (!isVisible) return;

      const delta = time - lastFrameTime;
      if (delta < targetInterval) return;
      lastFrameTime = time - (delta % targetInterval);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Hero text center for legibility ellipse mask
      const textCenterX = width * 0.5;
      const textCenterY = height * 0.44;
      const radiusX = Math.min(width * 0.44, 460);
      const radiusY = Math.min(height * 0.38, 250);

      const dprFactor = dpr;

      for (let i = 0; i < particleBudget; i++) {
        const p = particles[i];

        // Drift upwards
        p.y -= p.vy;
        p.x = p.baseX + Math.sin(time * p.swaySpeed + p.swayOffset) * p.swayDist;

        // Wrap around vertically
        if (p.y < -30) {
          p.y = height + 20;
          p.baseX = Math.random() * width;
        }

        // Gentle mouse repulsion
        const dx = p.x - mousePos.x;
        const dy = p.y - mousePos.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 10000 && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (100 - dist) / 100;
          p.x += (dx / dist) * force * 1.5;
        }

        // Legibility Mask: Calculate normalized distance from hero text center
        const normDx = (p.x - textCenterX) / radiusX;
        const normDy = (p.y - textCenterY) / radiusY;
        const maskDist = Math.sqrt(normDx * normDx + normDy * normDy);

        // Particles completely fade to 0 over headline/subline/CTAs
        let legibilityFactor = 1.0;
        if (maskDist < 1.0) {
          legibilityFactor = Math.max(0, (maskDist - 0.35) / 0.65);
        }

        const alpha = p.baseAlpha * legibilityFactor;
        if (alpha <= 0.01) continue;

        const glyph = spriteMap[p.glyphIndex];

        ctx.globalAlpha = Math.min(alpha, 0.35);
        ctx.drawImage(
          atlasCanvas,
          glyph.sx,
          glyph.sy,
          glyph.sw,
          glyph.sh,
          Math.floor(p.x * dprFactor),
          Math.floor(p.y * dprFactor),
          glyph.sw * dprFactor,
          glyph.sh * dprFactor
        );
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [introDone]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
