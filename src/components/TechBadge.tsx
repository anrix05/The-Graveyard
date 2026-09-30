import React from 'react';
import { cn } from '@/lib/utils';

interface TechBadgeProps {
  tech: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const TechBadge: React.FC<TechBadgeProps> = ({ tech, className, size = 'sm' }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-medium rounded-full border border-line transition-colors select-none',
        'bg-surface-2 text-fg/80 hover:text-white hover:border-white/20',
        size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1',
        className
      )}
    >
      <span className="w-1 h-1 rounded-full bg-white/40 shrink-0" />
      <span>{tech}</span>
    </span>
  );
};

export default TechBadge;