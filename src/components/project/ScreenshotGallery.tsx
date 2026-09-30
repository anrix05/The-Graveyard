'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface ScreenshotGalleryProps {
  screenshots: string[];
  title: string;
}

export default function ScreenshotGallery({
  screenshots,
  title,
}: ScreenshotGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const count = screenshots.length;

  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev === 0 ? count - 1 : prev - 1));
  }, [count]);

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev === count - 1 ? 0 : prev + 1));
  }, [count]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen, handlePrev, handleNext]);

  if (!screenshots || screenshots.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Main Image Viewport (16:10) */}
      <div
        onClick={() => setIsLightboxOpen(true)}
        className="group relative aspect-[16/10] w-full overflow-hidden rounded-card bg-surface border border-line cursor-zoom-in"
      >
        <Image
          src={screenshots[activeIdx]}
          alt={`${title} screenshot ${activeIdx + 1}`}
          fill
          priority
          unoptimized
          sizes="(max-width: 1024px) 100vw, 65vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="p-2.5 rounded-full bg-black/75 border border-white/20 text-white flex items-center gap-1.5 shadow-lg">
            <Maximize2 className="w-4 h-4" />
            <span className="font-mono text-xs font-medium pr-1">Expand</span>
          </div>
        </div>

        <div className="absolute bottom-3 right-3 font-mono text-xs text-white/90 px-2.5 py-1 rounded-full bg-black/75 border border-white/15 tabular-nums pointer-events-none">
          {activeIdx + 1} / {count}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {count > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1" data-lenis-prevent>
          {screenshots.map((shot, idx) => (
            <button
              key={shot + idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`relative aspect-[16/10] w-24 sm:w-28 rounded-xl overflow-hidden border transition-all shrink-0 ${
                activeIdx === idx
                  ? 'border-white ring-2 ring-white/20'
                  : 'border-line opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={shot}
                alt={`${title} thumb ${idx + 1}`}
                fill
                unoptimized
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8 animate-in fade-in duration-150"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close preview"
            className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter pill */}
          <div className="absolute top-5 left-5 z-20 font-mono text-xs text-white/90 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 tabular-nums">
            {activeIdx + 1} of {count}
          </div>

          {/* Main image container */}
          <div
            className="relative w-full max-w-5xl aspect-[16/10] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={screenshots[activeIdx]}
              alt={`${title} enlarged screenshot ${activeIdx + 1}`}
              fill
              unoptimized
              sizes="90vw"
              className="object-contain"
            />
          </div>

          {/* Previous button */}
          {count > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous screenshot"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next button */}
          {count > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next screenshot"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
