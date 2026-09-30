'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonMode = 'buy' | 'adopt' | 'collab' | 'brand' | 'neutral';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  mode?: ButtonMode;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      mode = 'neutral',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Mode specific styles for primary variant
    // In standard context, primary is white fill with near-black text.
    // In listing contexts (buy, adopt, collab), mode accent fill is applied.
    const primaryModeClasses: Record<ButtonMode, string> = {
      buy: 'bg-[#39ff14] text-[#0a0a0b] hover:bg-[#32e612]',
      adopt: 'bg-[#fbbf24] text-[#0a0a0b] hover:bg-[#f59e0b]',
      collab: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]',
      brand: 'bg-white text-[#0a0a0b] hover:bg-neutral-200',
      neutral: 'bg-white text-[#0a0a0b] hover:bg-neutral-200',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary: cn('rounded-full font-semibold', primaryModeClasses[mode]),
      secondary:
        'rounded-full bg-surface-2 border border-line text-white hover:border-white/20 hover:bg-surface-3 transition-colors font-medium',
      ghost:
        'rounded-full bg-transparent text-muted hover:text-white transition-colors font-medium',
      danger:
        'rounded-full bg-[#dc2626] text-white hover:bg-[#b91c1c] font-medium transition-colors',
    };

    // Standard heights: 40px (sm), 48px (md), 56px (lg)
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'h-10 px-4 text-[13px] gap-2 font-medium',
      md: 'h-12 px-6 text-[15px] gap-2.5 font-medium',
      lg: 'h-14 px-8 text-base gap-3 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          'group relative inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150',
          'select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : 'w-auto',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0 transition-transform group-hover:-translate-x-0.5">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0 transition-transform group-hover:translate-x-1">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
