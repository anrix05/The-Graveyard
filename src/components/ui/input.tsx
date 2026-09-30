import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
  label?: string;
  helperText?: string;
  isCode?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, isCode = false, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-sans font-medium text-fg">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-11 w-full rounded-[12px] border bg-surface-2 px-4 py-2.5 text-sm text-fg",
            isCode || type === 'url' ? 'font-mono' : 'font-sans',
            "placeholder:text-muted/60 transition-colors duration-150",
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

Input.displayName = "Input";

export default Input;
export { Input };
