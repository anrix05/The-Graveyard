import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  id: number;
  label: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className,
}) => {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex items-center justify-between gap-2 sm:gap-4 relative">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.id} className="flex-1 flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                disabled={!isCompleted && !isCurrent}
                onClick={() => onStepClick?.(step.id)}
                className={cn(
                  'flex items-center gap-2 text-left group transition-all',
                  (!isCompleted && !isCurrent) && 'opacity-40 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-mono text-xs font-medium transition-all border',
                    isCompleted && 'bg-[#39ff14]/15 border-[#39ff14] text-[#39ff14]',
                    isCurrent && 'bg-white text-black border-white shadow-[0_0_14px_rgba(255,255,255,0.25)]',
                    !isCompleted && !isCurrent && 'bg-surface-2 border-line text-muted'
                  )}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.id}
                </div>
                <span
                  className={cn(
                    'font-sans text-xs sm:text-sm font-medium tracking-normal hidden md:inline-block transition-colors',
                    isCurrent ? 'text-white' : 'text-muted'
                  )}
                >
                  {step.label}
                </span>
              </button>

              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-[1px] mx-2 transition-colors',
                    isCompleted ? 'bg-[#39ff14]/40' : 'bg-line'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;
