'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PasswordStrengthMeterProps {
  password: string;
}

export interface PasswordScore {
  score: number; // 0 to 4
  label: 'Weak' | 'Okay' | 'Strong';
  color: string;
}

export function evaluatePasswordStrength(password: string): PasswordScore {
  if (!password) {
    return { score: 0, label: 'Weak', color: 'bg-neutral-700' };
  }

  let score = 0;

  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const varietyCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  if (varietyCount >= 3) score += 1;
  if (varietyCount === 4 && password.length >= 10) score += 1;

  // Cap score to 4
  const finalScore = Math.min(score, 4);

  if (finalScore <= 1) {
    return { score: Math.max(1, finalScore), label: 'Weak', color: 'bg-brand-red' };
  }
  if (finalScore <= 3) {
    return { score: finalScore, label: 'Okay', color: 'bg-amber-500' };
  }
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label, color } = evaluatePasswordStrength(password);

  return (
    <div className="w-full mt-2 space-y-1.5" aria-live="polite">
      {/* 4-segment visual bar */}
      <div className="flex items-center gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              'h-full flex-1 rounded-full transition-colors duration-200',
              step <= score ? color : 'bg-surface-3'
            )}
          />
        ))}
      </div>

      {/* Accessible text label (not color-only) */}
      <div className="flex justify-between items-center text-xs font-sans">
        <span className="text-muted">Password strength:</span>
        <span
          className={cn(
            'font-medium',
            label === 'Weak' && 'text-brand-red',
            label === 'Okay' && 'text-amber-400',
            label === 'Strong' && 'text-emerald-400'
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
