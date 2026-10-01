'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCw, Monitor, ExternalLink } from 'lucide-react';

interface Preset {
  label: string;
  width: number;
  height: number;
  category: 'phone' | 'tablet' | 'desktop' | 'ultrawide';
}

const PRESETS: Preset[] = [
  { label: '320×568 (iPhone SE 1st)', width: 320, height: 568, category: 'phone' },
  { label: '360×800 (Android Common)', width: 360, height: 800, category: 'phone' },
  { label: '390×844 (iPhone 12/13/14)', width: 390, height: 844, category: 'phone' },
  { label: '430×932 (iPhone Pro Max)', width: 430, height: 932, category: 'phone' },
  { label: '667×375 (Phone Landscape)', width: 667, height: 375, category: 'phone' },
  { label: '768×1024 (iPad Portrait)', width: 768, height: 1024, category: 'tablet' },
  { label: '1024×768 (iPad Landscape)', width: 1024, height: 768, category: 'tablet' },
  { label: '1280×720 (HD Laptop)', width: 1280, height: 720, category: 'desktop' },
  { label: '1366×768 (Standard Laptop)', width: 1366, height: 768, category: 'desktop' },
  { label: '1440×900 (MacBook Air)', width: 1440, height: 900, category: 'desktop' },
  { label: '1920×1080 (FHD Desktop)', width: 1920, height: 1080, category: 'desktop' },
  { label: '2560×1440 (QHD 2K)', width: 2560, height: 1440, category: 'desktop' },
  { label: '3440×1440 (Ultrawide)', width: 3440, height: 1440, category: 'ultrawide' },
];

export default function ResponsivePreviewPage() {
  const [route, setRoute] = useState('/');
  const [selectedPreset, setSelectedPreset] = useState<string>('390×844 (iPhone 12/13/14)');
  const [width, setWidth] = useState<number>(390);
  const [height, setHeight] = useState<number>(844);
  const [scaleToFit, setScaleToFit] = useState<boolean>(true);
  const [skipIntro, setSkipIntro] = useState<boolean>(true);
  const [calculatedScale, setCalculatedScale] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Apply preset
  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = PRESETS.find((p) => p.label === e.target.value);
    if (found) {
      setSelectedPreset(found.label);
      setWidth(found.width);
      setHeight(found.height);
    }
  };

  // Rotate dimensions
  const handleRotate = () => {
    setWidth(height);
    setHeight(width);
    setSelectedPreset('Custom');
  };

  // Recalculate scale whenever width/height/scaleToFit or window size changes
  useEffect(() => {
    const updateScale = () => {
      if (!scaleToFit || !containerRef.current) {
        setCalculatedScale(1);
        return;
      }

      const availableW = containerRef.current.clientWidth - 48; // padding
      const availableH = containerRef.current.clientHeight - 48;

      if (availableW <= 0 || availableH <= 0) return;

      const scaleX = availableW / width;
      const scaleY = availableH / height;
      const bestScale = Math.min(scaleX, scaleY, 1);
      setCalculatedScale(Math.max(0.2, Math.round(bestScale * 100) / 100));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [width, height, scaleToFit]);

  // Construct iframe src with optional ?intro=0
  const getIframeSrc = () => {
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    if (!skipIntro) return cleanRoute;

    const separator = cleanRoute.includes('?') ? '&' : '?';
    return `${cleanRoute}${separator}intro=0`;
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0b] text-white flex flex-col font-sans select-none">
      {/* Top Controls Toolbar */}
      <header className="sticky top-0 z-50 bg-[#121214]/95 border-b border-white/10 backdrop-blur-md px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back & Route */}
        <div className="flex items-center gap-3">
          <Link
            href="/design-system"
            className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Design System</span>
          </Link>
          <span className="text-white/20">|</span>
          <span className="font-display font-semibold text-sm text-white flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-brand-red" />
            Responsive Simulator
          </span>
        </div>

        {/* Center: Route input & Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Route input */}
          <div className="flex items-center bg-black/60 border border-white/10 rounded-full px-3 py-1 font-mono text-xs">
            <span className="text-muted mr-1.5">Route:</span>
            <input
              type="text"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="/"
              className="bg-transparent text-white outline-none w-28 sm:w-40 font-mono text-xs"
            />
          </div>

          {/* Preset Select */}
          <select
            value={selectedPreset}
            onChange={handleSelectPreset}
            aria-label="Viewport preset selection"
            className="bg-black/60 border border-white/10 text-white rounded-full px-3 py-1.5 font-mono text-xs outline-none cursor-pointer hover:border-white/20"
          >
            <option value="Custom" disabled>
              Custom Size
            </option>
            {PRESETS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Width x Height */}
          <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-full px-2.5 py-1 font-mono text-xs">
            <input
              type="number"
              value={width}
              onChange={(e) => {
                setWidth(Number(e.target.value));
                setSelectedPreset('Custom');
              }}
              className="w-12 bg-transparent text-center text-white outline-none"
              min={240}
              max={4000}
            />
            <span className="text-muted">×</span>
            <input
              type="number"
              value={height}
              onChange={(e) => {
                setHeight(Number(e.target.value));
                setSelectedPreset('Custom');
              }}
              className="w-12 bg-transparent text-center text-white outline-none"
              min={240}
              max={4000}
            />
            <span className="text-muted text-[10px]">px</span>
          </div>

          {/* Rotate Button */}
          <button
            type="button"
            onClick={handleRotate}
            title="Rotate viewport orientation"
            className="p-1.5 bg-black/60 border border-white/10 hover:border-white/30 rounded-full text-muted hover:text-white transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Toggles */}
        <div className="flex items-center gap-3">
          {/* Scale to fit toggle */}
          <label className="flex items-center gap-1.5 font-mono text-xs text-muted cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={scaleToFit}
              onChange={(e) => setScaleToFit(e.target.checked)}
              className="rounded border-white/20 bg-black/40 text-brand-red focus:ring-0"
            />
            <span>Fit ({Math.round(calculatedScale * 100)}%)</span>
          </label>

          {/* Intro toggle */}
          <label className="flex items-center gap-1.5 font-mono text-xs text-muted cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={skipIntro}
              onChange={(e) => setSkipIntro(e.target.checked)}
              className="rounded border-white/20 bg-black/40 text-brand-red focus:ring-0"
            />
            <span>Skip Intro</span>
          </label>

          <a
            href={route}
            target="_blank"
            rel="noopener noreferrer"
            title="Open route in new tab"
            className="p-1.5 bg-black/60 border border-white/10 hover:border-white/30 rounded-full text-muted hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Preview Canvas Area */}
      <main
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#050505] p-6 flex items-center justify-center relative min-h-[calc(100dvh-60px)]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Device Frame */}
        <div
          className="transition-transform duration-200 ease-out origin-center relative shadow-2xl rounded-2xl border-4 border-[#222226] bg-black overflow-hidden flex flex-col"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: scaleToFit ? `scale(${calculatedScale})` : 'none',
            flexShrink: 0,
          }}
        >
          {/* Mini device header info bar */}
          <div className="bg-[#18181c] px-3 py-1 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-white/50 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-red/80 inline-block" />
              <span>{width}×{height}</span>
            </div>
            <span className="truncate max-w-[200px]">{getIframeSrc()}</span>
            <span>{Math.round(calculatedScale * 100)}%</span>
          </div>

          {/* Iframe Viewport */}
          <iframe
            src={getIframeSrc()}
            title="Graveyard Responsive Simulator"
            className="w-full flex-1 border-0 bg-bg"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </main>
    </div>
  );
}
