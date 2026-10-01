'use client';

import React from 'react';
import Link from 'next/link';
import Img from '@/components/ui/Img';
import { Project } from '@/types/project';
import { formatEpitaph } from '@/lib/epitaph';
import { ModeBadge } from '@/components/ui/badge';
import TechBadge from '@/components/TechBadge';
import CoverArt from '@/components/CoverArt';
import CardFooter from '@/components/CardFooter';

interface CompactProjectCardProps {
  project: Project;
}

export default function CompactProjectCard({ project }: CompactProjectCardProps) {
  const tombstone = formatEpitaph(project);
  const visibleTechs = (project.tech_stack || []).slice(0, 3);
  const remainingCount = (project.tech_stack?.length || 0) - visibleTechs.length;

  return (
    <div className="group relative rounded-card bg-surface border border-line hover:border-white/20 transition-colors duration-200 overflow-hidden flex flex-col sm:flex-row h-full">
      {/* Cover Column 40% */}
      <div className="relative w-full sm:w-[40%] min-h-[140px] sm:min-h-full overflow-hidden bg-surface-2 shrink-0">
        {project.cover_url ? (
          <Img
            src={project.cover_url}
            alt={`${project.title} cover image`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 200px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <CoverArt
            id={project.id}
            title={project.title}
            mode={project.interaction_type}
          />
        )}
        <div className="absolute top-2.5 left-2.5 z-10">
          <ModeBadge mode={project.interaction_type} size="sm" />
        </div>
      </div>

      {/* Content Column */}
      <div className="flex flex-col justify-between flex-1 p-4 overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-sans font-semibold text-base text-white truncate">
              <Link
                href={`/project/${project.id}`}
                className="relative no-underline inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-white after:origin-left after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-200 truncate max-w-full"
              >
                {project.title}
              </Link>
            </h4>
            {project.completion_percent != null && (
              <span className="font-mono text-[10px] text-muted shrink-0 tabular-nums">
                {project.completion_percent}%
              </span>
            )}
          </div>

          <p className="font-sans text-xs text-fg/75 line-clamp-2 leading-relaxed">
            {project.tagline || project.description}
          </p>

          {visibleTechs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
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

          {tombstone && (
            <p className="font-mono text-[10px] text-muted truncate">
              {tombstone}
            </p>
          )}
        </div>

        <CardFooter project={project} className="mt-2 pt-2" />
      </div>
    </div>
  );
}
