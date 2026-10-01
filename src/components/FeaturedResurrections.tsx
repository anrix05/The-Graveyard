'use client';

import React from 'react';
import Link from 'next/link';
import Img from '@/components/ui/Img';
import { ArrowRight, Flame } from 'lucide-react';
import { Project } from '@/types/project';
import { formatEpitaph } from '@/lib/epitaph';
import { ModeBadge } from '@/components/ui/badge';
import TechBadge from '@/components/TechBadge';
import CoverArt from '@/components/CoverArt';
import CardFooter from '@/components/CardFooter';
import Reveal from '@/components/motion/Reveal';

interface FeaturedResurrectionsProps {
  projects: Project[];
  onActionClick?: (project: Project, e: React.MouseEvent) => void;
}

export default function FeaturedResurrections({
  projects,
  onActionClick,
}: FeaturedResurrectionsProps) {
  if (!projects || projects.length === 0) return null;

  const count = projects.length;
  const mainFeatured = projects[0];
  const sideCards = projects.slice(1, 3);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-brand-red animate-pulse" />
              <span className="font-mono text-xs text-brand-red uppercase tracking-widest font-semibold">
                Curated Codebases
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-semibold text-white tracking-tight">
              Featured resurrections
            </h2>
          </div>

          <Link
            href="#marketplace-feed"
            className="group inline-flex items-center gap-1.5 font-sans font-medium text-sm text-muted hover:text-white transition-colors"
          >
            <span>View all projects</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </Reveal>

      {/* 3 ITEMS: FIXED-ROW BENTO ON LG, 2-COLS ON MD, 1-COL ON MOBILE */}
      {count >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
          {/* Large Card: cols 1-7 on lg, full width on md and mobile */}
          <div className="col-span-1 md:col-span-2 lg:col-span-7 lg:min-h-[624px] group relative rounded-card bg-surface border border-line hover:border-white/20 transition-colors duration-200 overflow-hidden flex flex-col justify-between min-w-0">
            {/* Top Cover Area */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-[345px] overflow-hidden bg-surface-2 shrink-0">
              {mainFeatured.cover_url ? (
                <Img
                  src={mainFeatured.cover_url}
                  alt={`${mainFeatured.title} cover image`}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <CoverArt
                  id={mainFeatured.id}
                  title={mainFeatured.title}
                  mode={mainFeatured.interaction_type}
                />
              )}

              {/* Mode Pill top-left */}
              <div className="absolute top-4 left-4 z-10">
                <ModeBadge mode={mainFeatured.interaction_type} size="md" />
              </div>

              {/* Completion % chip top-right */}
              {mainFeatured.completion_percent != null && (
                <div className="absolute top-4 right-4 z-10 font-mono text-xs font-medium text-white/90 px-3 py-1 rounded-full bg-black/85 border border-white/15 tabular-nums">
                  {mainFeatured.completion_percent}% built
                </div>
              )}

              {/* Epitaph Pull-quote overlapping lower edge with gradient scrim */}
              {mainFeatured.epitaph && (
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-surface via-surface/80 to-transparent z-10">
                  <p className="font-serif italic text-white text-lg sm:text-xl lg:text-[22px] leading-snug drop-shadow-md break-anywhere">
                    &ldquo;{mainFeatured.epitaph}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-5 sm:p-7 flex flex-col flex-1 justify-between min-w-0">
              <div>
                <h3 className="font-sans font-semibold text-xl sm:text-2xl lg:text-[28px] text-white leading-tight break-anywhere">
                  <Link
                    href={`/project/${mainFeatured.id}`}
                    className="relative no-underline inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-white after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
                  >
                    {mainFeatured.title}
                  </Link>
                </h3>

                <p className="font-sans text-sm sm:text-base text-fg/80 mt-2.5 line-clamp-2 leading-relaxed break-anywhere">
                  {mainFeatured.tagline || mainFeatured.description}
                </p>

                {/* Tech Pills (up to 4) */}
                {mainFeatured.tech_stack && mainFeatured.tech_stack.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {mainFeatured.tech_stack.slice(0, 4).map((tech) => (
                      <TechBadge key={tech} tech={tech} size="sm" />
                    ))}
                    {mainFeatured.tech_stack.length > 4 && (
                      <span className="font-mono text-[11px] text-muted px-2 py-0.5 rounded-full bg-surface-2 border border-line">
                        +{mainFeatured.tech_stack.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Tombstone line in mono 12px */}
                {formatEpitaph(mainFeatured) && (
                  <p className="font-mono text-xs text-muted mt-3 uppercase tracking-wider truncate">
                    {formatEpitaph(mainFeatured)}
                  </p>
                )}
              </div>

              {/* Shared CardFooter */}
              <CardFooter
                project={mainFeatured}
                onActionClick={onActionClick}
                className="mt-4"
              />
            </div>
          </div>

          {/* Two Compact Cards: cols 8-12 on lg, side by side on md, stacked on mobile */}
          <div className="col-span-1 md:col-span-2 lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-col gap-6 lg:min-h-[624px] justify-between">
            {sideCards.map((project) => {
              const tombstone = formatEpitaph(project);
              const visibleTechs = (project.tech_stack || []).slice(0, 3);
              const remainingCount = (project.tech_stack?.length || 0) - visibleTechs.length;

              return (
                <div
                  key={project.id}
                  className="@container lg:h-[300px] group relative rounded-card bg-surface border border-line hover:border-white/20 transition-colors duration-200 overflow-hidden flex flex-col @[420px]:flex-row justify-between min-w-0"
                >
                  {/* Cover: full width aspect-ratio on mobile, 42% on wide container */}
                  <div className="relative w-full @[420px]:w-[42%] aspect-[16/10] @[420px]:aspect-auto min-h-[160px] @[420px]:min-h-full self-stretch overflow-hidden bg-surface-2 shrink-0">
                    {project.cover_url ? (
                      <Img
                        src={project.cover_url}
                        alt={`${project.title} cover image`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <CoverArt
                        id={project.id}
                        title={project.title}
                        mode={project.interaction_type}
                      />
                    )}
                  </div>

                  {/* Content (20px padding) */}
                  <div className="flex flex-col justify-between flex-1 p-4 sm:p-5 overflow-hidden min-w-0">
                    <div className="space-y-2">
                      {/* Top row: Mode pill + completion_percent chip */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <ModeBadge mode={project.interaction_type} size="sm" />
                        {project.completion_percent != null && (
                          <span className="font-mono text-[10px] text-muted px-2 py-0.5 rounded-full bg-surface-2 border border-line tabular-nums">
                            {project.completion_percent}% built
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-sans font-semibold text-base sm:text-lg text-white truncate break-anywhere">
                        <Link
                          href={`/project/${project.id}`}
                          className="relative no-underline inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-white after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 truncate max-w-full"
                        >
                          {project.title}
                        </Link>
                      </h4>

                      {/* Tagline / description */}
                      <p className="font-sans text-xs text-fg/80 line-clamp-2 sm:line-clamp-3 leading-relaxed break-anywhere">
                        {project.tagline || project.description}
                      </p>

                      {/* Tech pills (up to 3) */}
                      {visibleTechs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {visibleTechs.map((tech) => (
                            <TechBadge key={tech} tech={tech} size="sm" />
                          ))}
                          {remainingCount > 0 && (
                            <span className="font-mono text-[10px] text-muted px-1.5 py-0.5 rounded-full bg-surface-2 border border-line">
                              +{remainingCount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tombstone line */}
                      {tombstone && (
                        <p className="font-mono text-[11px] text-muted truncate pt-0.5">
                          {tombstone}
                        </p>
                      )}
                    </div>

                    {/* Shared CardFooter pinned to bottom */}
                    <CardFooter
                      project={project}
                      onActionClick={onActionClick}
                      className="mt-auto pt-3"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2 ITEMS: TWO EQUAL CARDS SIDE BY SIDE (vertical layout) */}
      {count === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-card bg-surface border border-line hover:border-white/20 transition-colors duration-200 overflow-hidden flex flex-col justify-between min-h-[520px]"
            >
              <div className="relative w-full h-[260px] overflow-hidden bg-surface-2 shrink-0">
                {project.cover_url ? (
                  <Img
                    src={project.cover_url}
                    alt={`${project.title} cover image`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <CoverArt
                    id={project.id}
                    title={project.title}
                    mode={project.interaction_type}
                  />
                )}
                <div className="absolute top-3.5 left-3.5 z-10">
                  <ModeBadge mode={project.interaction_type} size="sm" />
                </div>
                {project.completion_percent != null && (
                  <div className="absolute top-3.5 right-3.5 z-10 font-mono text-xs text-white/90 px-2.5 py-1 rounded-full bg-black/80 border border-white/15">
                    {project.completion_percent}% built
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="font-sans font-semibold text-2xl text-white">
                    <Link
                      href={`/project/${project.id}`}
                      className="relative no-underline inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-white after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
                    >
                      {project.title}
                    </Link>
                  </h3>
                  <p className="font-sans text-sm text-fg/80 mt-2 line-clamp-2 leading-relaxed">
                    {project.tagline || project.description}
                  </p>
                  {formatEpitaph(project) && (
                    <p className="font-mono text-xs text-muted mt-2 truncate">
                      {formatEpitaph(project)}
                    </p>
                  )}
                </div>

                <CardFooter
                  project={project}
                  onActionClick={onActionClick}
                  className="mt-6"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1 ITEM: FULL-WIDTH LARGE CARD */}
      {count === 1 && (
        <div className="group relative rounded-card bg-surface border border-line hover:border-white/20 transition-colors duration-200 overflow-hidden flex flex-col md:flex-row min-h-[400px]">
          <div className="relative w-full md:w-1/2 min-h-[260px] md:min-h-full overflow-hidden bg-surface-2 shrink-0">
            {mainFeatured.cover_url ? (
              <Img
                src={mainFeatured.cover_url}
                alt={`${mainFeatured.title} cover image`}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            ) : (
              <CoverArt
                id={mainFeatured.id}
                title={mainFeatured.title}
                mode={mainFeatured.interaction_type}
              />
            )}
            <div className="absolute top-4 left-4 z-10">
              <ModeBadge mode={mainFeatured.interaction_type} size="md" />
            </div>
            {mainFeatured.completion_percent != null && (
              <div className="absolute top-4 right-4 z-10 font-mono text-xs text-white/90 px-3 py-1 rounded-full bg-black/85 border border-white/15">
                {mainFeatured.completion_percent}% built
              </div>
            )}
          </div>

          <div className="p-8 flex flex-col justify-between flex-1">
            <div>
              <h3 className="font-sans font-semibold text-3xl text-white">
                <Link
                  href={`/project/${mainFeatured.id}`}
                  className="relative no-underline inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-white after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
                >
                  {mainFeatured.title}
                </Link>
              </h3>
              <p className="font-sans text-base text-fg/80 mt-3 line-clamp-3 leading-relaxed">
                {mainFeatured.tagline || mainFeatured.description}
              </p>
              {formatEpitaph(mainFeatured) && (
                <p className="font-mono text-xs text-muted mt-3">
                  {formatEpitaph(mainFeatured)}
                </p>
              )}
            </div>

            <CardFooter
              project={mainFeatured}
              onActionClick={onActionClick}
              className="mt-6"
            />
          </div>
        </div>
      )}
    </section>
  );
}
