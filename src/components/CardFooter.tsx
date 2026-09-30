'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Project } from '@/types/project';
import { formatINR } from '@/lib/format';
import Avatar from '@/components/ui/Avatar';

interface CardFooterProps {
  project: Project;
  onActionClick?: (project: Project, e: React.MouseEvent) => void;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  project,
  onActionClick,
  className = '',
}) => {
  const { seller, title, interaction_type, price_paise, collab_terms } = project;
  const username = seller?.username || 'operative';

  // Format right-hand price/label
  const renderPriceOrLabel = () => {
    if (interaction_type === 'buy') {
      return (
        <span className="font-mono font-medium text-sm sm:text-base text-white tabular-nums">
          {formatINR(price_paise, { showFreeForZero: false })}
        </span>
      );
    }

    if (interaction_type === 'adopt') {
      return (
        <span className="font-mono font-medium text-sm sm:text-base text-white tabular-nums">
          Free
        </span>
      );
    }

    // Collab listing: render collab terms as a small pill or fallback text
    const terms = collab_terms?.trim() || 'Seeking partner';
    return (
      <span className="font-mono text-[11px] sm:text-xs text-blue-accent/90 px-2.5 py-1 rounded-full bg-blue-accent/10 border border-blue-accent/30 max-w-[140px] truncate" title={terms}>
        {terms}
      </span>
    );
  };

  return (
    <div className={`pt-4 border-t border-line flex items-center justify-between gap-3 relative z-20 ${className}`}>
      {/* Left: Seller avatar (28px) + @username (Geist 500, 14px, truncates with ellipsis) */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar
          src={seller?.avatar_url}
          username={username}
          size="sm"
          className="w-7 h-7 shrink-0"
        />
        <span
          title={`@${username}`}
          className="font-sans font-medium text-sm text-muted hover:text-white transition-colors truncate max-w-[120px] sm:max-w-[150px]"
        >
          @{username}
        </span>
      </div>

      {/* Right: Price/Label + 40px Circular Arrow Button */}
      <div className="flex items-center gap-3 shrink-0">
        {renderPriceOrLabel()}

        <Link
          href={`/project/${project.id}`}
          onClick={(e) => {
            if (onActionClick) {
              e.stopPropagation();
              onActionClick(project, e);
            }
          }}
          aria-label={`View ${title}`}
          className="w-10 h-10 rounded-full border border-line bg-surface-2 hover:bg-white hover:text-black flex items-center justify-center text-white/80 transition-all duration-200 group/btn shrink-0"
        >
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-[3px]" />
        </Link>
      </div>
    </div>
  );
};

export default CardFooter;
