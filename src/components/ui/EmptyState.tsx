import React from 'react';
import Button from './Button';
import { cn } from '@/lib/utils';

export function TombstoneIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-16 h-16', className)}
    >
      {/* Soft shadow */}
      <ellipse cx="40" cy="72" rx="28" ry="4" fill="rgba(255,255,255,0.04)" />
      {/* Tombstone body */}
      <path
        d="M24 70V32C24 23.1634 31.1634 16 40 16C48.8366 16 56 23.1634 56 32V70H24Z"
        fill="#17171a"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.5"
      />
      {/* Stone base */}
      <rect
        x="18"
        y="68"
        width="44"
        height="5"
        rx="2"
        fill="#1e1e22"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.5"
      />
      {/* RIP or Cross mark */}
      <path
        d="M40 28V46M34 34H46"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Subtle crack */}
      <path
        d="M44 48L46 54L43 57"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}) => {
  return (
    <div className={cn('max-w-md mx-auto my-8 p-8 text-center flex flex-col items-center justify-center bg-surface rounded-card border border-line', className)}>
      <div className="mb-4">
        {icon || <TombstoneIllustration />}
      </div>
      <h3 className="font-display text-lg text-white font-semibold mb-2">{title}</h3>
      <p className="font-sans text-sm text-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
