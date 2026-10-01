'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Img from '@/components/ui/Img';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Project } from '@/types/project';
import CoverArt from '@/components/CoverArt';
import Avatar from '@/components/ui/Avatar';

interface ResurrectedWallProps {
  projects: Project[];
}

export default function ResurrectedWall({ projects }: ResurrectedWallProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!projects || projects.length === 0) {
    return null;
  }

  const handleScrollDirection = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handleScrollDirection('left');
    } else if (e.key === 'ArrowRight') {
      handleScrollDirection('right');
    }
  };

  return (
    <section className="py-16 sm:py-20 border-t border-line overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-neon-green" />
            <span className="font-mono text-xs text-neon-green uppercase tracking-widest font-semibold">
              The Wall of Resurrection
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display text-white">
            Codebases given a second life
          </h2>
          <p className="text-muted text-xs sm:text-sm mt-1 max-w-lg">
            These abandoned projects were claimed, purchased, or partnered through the terminal and are thriving again.
          </p>
        </div>

        {/* Scroll Controls (visible on all screens) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleScrollDirection('left')}
            className="p-2 sm:p-2.5 rounded-full border border-line bg-surface-2 text-muted hover:text-white hover:border-white/20 transition-colors"
            aria-label="Scroll left"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScrollDirection('right')}
            className="p-2 sm:p-2.5 rounded-full border border-line bg-surface-2 text-muted hover:text-white hover:border-white/20 transition-colors"
            aria-label="Scroll right"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Draggable Snap Rail with arrow key navigation */}
      <div
        ref={scrollContainerRef}
        data-cursor="Drag"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 px-4 sm:px-6 lg:px-8 snap-x snap-mandatory scrollbar-none select-none scroll-px-4 sm:scroll-px-6 lg:scroll-px-8 focus-visible:outline-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        aria-label="Resurrected codebases rail. Use arrow keys to navigate."
      >
        {projects.map((project) => {
          const revivalText =
            project.interaction_type === 'buy'
              ? 'Purchased & transferred'
              : project.interaction_type === 'adopt'
              ? 'Fork claimed by community'
              : 'Partnership established';

          const revivalDate = project.revived_at
            ? new Date(project.revived_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })
            : 'Revived recently';

          return (
            <div
              key={project.id}
              className="w-[clamp(240px,70vw,340px)] shrink-0 snap-start rounded-[20px] bg-surface border border-line p-3.5 sm:p-4 space-y-3 hover:border-white/20 transition-all duration-300 min-w-0"
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-surface-2">
                {project.cover_url ? (
                  <Img
                    src={project.cover_url}
                    alt={`${project.title} cover image`}
                    fill
                    sizes="320px"
                    className="object-cover"
                  />
                ) : (
                  <CoverArt
                    id={project.id}
                    title={project.title}
                    mode={project.interaction_type}
                    aspectRatio="16/10"
                  />
                )}

                {/* Revived Pill Tag */}
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/90 border border-neon-green/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green shrink-0 animate-pulse" />
                  <span className="font-mono text-[10px] text-white font-bold uppercase tracking-wider">
                    REVIVED
                  </span>
                </div>
              </div>

              {/* Title & Info */}
              <div className="space-y-1">
                <h3 className="font-sans font-semibold text-base text-white truncate">
                  <Link
                    href={`/project/${project.id}`}
                    className="relative no-underline inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-white after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
                  >
                    {project.title}
                  </Link>
                </h3>
                <p className="font-mono text-xs text-neon-green/90">
                  {revivalText}
                </p>
                <p className="font-mono text-[11px] text-muted">
                  {revivalDate}
                </p>
              </div>

              {/* Seller / Contributor */}
              <div className="pt-2 border-t border-line/60 flex items-center gap-2">
                <Avatar
                  src={project.seller?.avatar_url}
                  username={project.seller?.username || 'operative'}
                  size="sm"
                />
                <span className="font-mono text-xs text-muted truncate">
                  @{project.seller?.username || 'operative'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
