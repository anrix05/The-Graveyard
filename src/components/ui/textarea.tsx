import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  label?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helperText, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-sans font-medium text-fg">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[100px] w-full rounded-[12px] border bg-surface-2 px-4 py-3 font-sans text-base sm:text-sm text-fg",
            "placeholder:text-muted/60 transition-colors duration-150 resize-y",
            hasError
              ? "border-brand-red focus:border-brand-red"
              : "border-line hover:border-white/20 focus:border-white",
            "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {errorMessage && (
          <p className="text-xs text-brand-red font-sans flex items-center gap-1">
            <span>•</span> {errorMessage}
          </p>
        )}
        {helperText && !errorMessage && (
          <p className="text-xs text-muted font-sans">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
export { Textarea };
