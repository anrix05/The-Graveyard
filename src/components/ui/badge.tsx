import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InteractionType } from '@/types/project';

// Mode Badge (Chamfered signature with colored dot + label)
export interface ModeBadgeProps {
  mode: InteractionType;
  className?: string;
  size?: 'sm' | 'md';
}

export const ModeBadge: React.FC<ModeBadgeProps> = ({ mode, className, size = 'sm' }) => {
  const configs: Record<InteractionType, { label: string; dotColor: string; colorClass: string }> = {
    buy: {
      label: 'For Sale',
      dotColor: 'bg-neon-green',
      colorClass: 'bg-[#39ff14]/10 text-white border-[#39ff14]/40',
    },
    adopt: {
      label: 'Free Fork',
      dotColor: 'bg-amber',
      colorClass: 'bg-[#fbbf24]/10 text-white border-[#fbbf24]/40',
    },
    collab: {
      label: 'Seeking Partner',
      dotColor: 'bg-blue-accent',
      colorClass: 'bg-[#3b82f6]/10 text-white border-[#3b82f6]/40',
    },
  };

  const config = configs[mode] || configs.buy;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-sans font-medium border rounded-full select-none',
        size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1',
        config.colorClass,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotColor)} />
      <span>{config.label}</span>
    </span>
  );
};

// Status Badge (Never color alone: always icon + label)
export type StatusType = 'live' | 'sold' | 'claimed' | 'filled' | 'archived' | 'pending' | 'failed' | 'sent' | 'revived';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
  const configs: Record<StatusType, { defaultLabel: string; icon: React.ReactNode; style: string }> = {
    live: {
      defaultLabel: 'Live',
      icon: <CheckCircle className="w-3 h-3 text-neon-green" />,
      style: 'border-[#39ff14]/40 text-neon-green bg-[#39ff14]/10',
    },
    revived: {
      defaultLabel: 'Revived',
      icon: <span className="w-2 h-2 rounded-full bg-neon-green shrink-0 animate-pulse" />,
      style: 'border-neon-green/30 text-white bg-neon-green/10',
    },
    sold: {
      defaultLabel: 'Sold',
      icon: <XCircle className="w-3 h-3 text-[#ff2a2a]" />,
      style: 'border-[#ff2a2a]/40 text-[#ff2a2a] bg-[#ff2a2a]/10',
    },
    claimed: {
      defaultLabel: 'Claimed',
      icon: <CheckCircle className="w-3 h-3 text-amber" />,
      style: 'border-[#fbbf24]/40 text-amber bg-[#fbbf24]/10',
    },
    filled: {
      defaultLabel: 'Filled',
      icon: <CheckCircle className="w-3 h-3 text-blue-400" />,
      style: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    },
    archived: {
      defaultLabel: 'Archived',
      icon: <AlertCircle className="w-3 h-3 text-muted" />,
      style: 'border-line text-muted bg-surface-2',
    },
    pending: {
      defaultLabel: 'Pending',
      icon: <Clock className="w-3 h-3 text-amber" />,
      style: 'border-[#fbbf24]/40 text-amber bg-[#fbbf24]/10',
    },
    sent: {
      defaultLabel: 'Sent',
      icon: <CheckCircle className="w-3 h-3 text-neon-green" />,
      style: 'border-[#39ff14]/40 text-neon-green bg-[#39ff14]/10',
    },
    failed: {
      defaultLabel: 'Failed',
      icon: <AlertCircle className="w-3 h-3 text-[#ff2a2a]" />,
      style: 'border-[#ff2a2a]/40 text-[#ff2a2a] bg-[#ff2a2a]/10',
    },
  };

  const config = configs[status] || configs.live;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full border',
        config.style,
        className
      )}
    >
      {config.icon}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};

// Generic Badge
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'buy' | 'adopt' | 'collab' | 'danger' | 'neutral' | 'success';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className,
  ...props
}) => {
  const variantStyles = {
    buy: 'bg-[#39ff14]/10 text-white border-[#39ff14]/30',
    adopt: 'bg-[#fbbf24]/10 text-white border-[#fbbf24]/30',
    collab: 'bg-[#3b82f6]/10 text-white border-[#3b82f6]/30',
    danger: 'bg-[#ff2a2a]/10 text-[#ff2a2a] border-[#ff2a2a]/30',
    neutral: 'bg-surface-2 text-muted border-line',
    success: 'bg-[#39ff14]/10 text-neon-green border-[#39ff14]/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono rounded-full border',
        size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
