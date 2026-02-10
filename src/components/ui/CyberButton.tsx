import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

    // Base styles
    const baseStyles = 'cyber-button inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant styles
    const variants = {
      primary: 'cyber-button-primary',
      secondary: 'cyber-button-secondary',
      ghost: 'cyber-button-ghost',
      danger: 'bg-cyber-red text-white hover:shadow-glow-red border border-transparent',
    };

    // Size styles
    const sizes = {
      sm: 'text-xs px-3 py-1.5',
      md: 'text-sm px-6 py-3',
      lg: 'text-base px-8 py-4',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;