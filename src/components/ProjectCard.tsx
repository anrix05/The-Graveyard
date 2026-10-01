'use client';

import React from 'react';
import Link from 'next/link';
import Img from '@/components/ui/Img';
import { Project } from '@/types/project';
import { formatEpitaph } from '@/lib/epitaph';
import { ModeBadge, StatusBadge } from '@/components/ui/badge';
import TechBadge from '@/components/TechBadge';
import CoverArt from '@/components/CoverArt';
import CardFooter from '@/components/CardFooter';

interface ProjectCardProps {
  project: Project;
  onActionClick?: (project: Project, e: React.MouseEvent) => void;
  isOwner?: boolean;
  isPurchased?: boolean;
  isCollaborator?: boolean;
  onDelete?: (id: string) => void;
}

export const ProjectCard = React.memo(function ProjectCard({
  project,
  onActionClick,
}: ProjectCardProps) {
  const {
    id,
    title,
    tagline,
    description,
    tech_stack = [],
    interaction_type,
    cover_url,
    is_sold,
    is_collab_filled,
    completion_percent,
  } = project;

  // Tombstone line in mono
  const tombstoneLine = formatEpitaph(project);

  // Show up to 3 badges, rest as +N counter
  const safeTechs = Array.isArray(tech_stack) ? tech_stack : [];
  const visibleTechs = safeTechs.slice(0, 3);
  const remainingTechsCount = Math.max(0, safeTechs.length - 3);

  return (
    <article
      data-cursor="View"
      className="group @container relative flex flex-col justify-between rounded-card bg-surface border border-line hover:border-white/20 transition-colors duration-200 overflow-hidden h-full select-none min-w-0"
    >
      {/* Edge-to-edge Cover Container (16:10 aspect ratio) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2 shrink-0">
        {cover_url ? (
          <Img
            src={cover_url}
            alt={`${title} cover image`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <CoverArt
            id={id}
            title={title}
            mode={interaction_type}
          />
        )}

        {/* Soft bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />

        {/* Mode Badge & Status on Top-Left */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
          <ModeBadge mode={interaction_type} />
          {is_sold && <StatusBadge status="sold" />}
          {is_collab_filled && <StatusBadge status="filled" />}
        </div>

        {/* Completion % chip on Top-Right (hide when null) */}
        {completion_percent != null && (
          <div className="absolute top-3 right-3 z-10 font-mono text-[10px] font-medium text-white/90 px-2 py-0.5 rounded-full bg-black/80 border border-white/15 tabular-nums">
            {completion_percent}% built
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3 min-w-0">
        {/* Title with accessible link (no default underline, animated on hover) */}
        <div className="space-y-1 min-w-0">
          <h3 className="font-sans font-semibold text-base sm:text-lg text-white tracking-tight line-clamp-1 break-anywhere">
            <Link
              href={`/project/${id}`}
              className="relative z-10 focus-visible:outline-none no-underline"
            >
              <span className="relative no-underline inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-white after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200">
                {title}
              </span>
            </Link>
          </h3>

          {/* Tombstone line in mono */}
          {tombstoneLine ? (
            <p className="font-mono text-[11px] text-muted truncate">
              {tombstoneLine}
            </p>
          ) : (
            <div className="h-[15px]" aria-hidden="true" />
          )}
        </div>

        {/* Tagline / Description: min-height area so cards don't shrink */}
        <p className="font-sans text-sm text-fg/75 line-clamp-2 min-h-[40px] leading-relaxed break-anywhere">
          {tagline || description || 'No description provided for this codebase.'}
        </p>

        {/* Tech Stack Pills: single row with +N overflow */}
        <div className="flex flex-nowrap items-center gap-1.5 pt-1 overflow-hidden relative z-20">
          {visibleTechs.map((tech) => (
            <TechBadge key={tech} tech={tech} size="sm" />
          ))}
          {remainingTechsCount > 0 && (
            <span className="font-mono text-[10px] text-muted px-2 py-0.5 rounded-full bg-surface-2 border border-line shrink-0">
              +{remainingTechsCount}
            </span>
          )}
        </div>

        {/* Shared CardFooter pinned to bottom */}
        <CardFooter
          project={project}
          onActionClick={onActionClick}
          className="mt-auto"
        />
      </div>
    </article>
  );
});

export default ProjectCard;
