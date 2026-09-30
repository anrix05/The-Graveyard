import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  subtitle?: string;
  accent?: 'buy' | 'adopt' | 'collab' | 'brand' | 'neutral';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtitle,
  accent = 'neutral',
  className,
}) => {
  const accentColorMap = {
    buy: 'text-[#39ff14]',
    adopt: 'text-[#fbbf24]',
    collab: 'text-[#60a5fa]',
    brand: 'text-[#ff2a2a]',
    neutral: 'text-white',
  };

  return (
    <div className={cn('p-5 bg-surface rounded-card border border-line flex flex-col justify-between h-full transition-all', className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className={cn('font-display font-semibold text-3xl tracking-tight my-1', accentColorMap[accent])}>
        {value}
      </div>
      {subtitle && <p className="font-sans text-xs text-muted mt-1">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
