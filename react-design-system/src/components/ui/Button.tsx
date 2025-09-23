import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  [
    'group inline-flex items-center justify-center gap-2 rounded-2xl',
    'font-medium tracking-tight transition-all duration-300 ease-spring-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-offset-neutral-900',
    'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none',
    'relative overflow-hidden isolate select-none',
    'will-change-transform',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-nav-gradient text-white shadow-glow',
          'hover:shadow-card hover:brightness-[1.05]',
          'focus-visible:ring-primary-300',
        ],
        secondary: [
          'bg-white text-primary-700 border border-primary-200 shadow-card',
          'hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-800',
          'dark:bg-neutral-900 dark:text-neutral-50 dark:border-primary-500/40 dark:hover:bg-primary-700/10',
        ],
        ghost: [
          'bg-transparent text-primary-600 dark:text-primary-200',
          'hover:text-primary-800 hover:bg-primary-200/20 dark:hover:text-white dark:hover:bg-primary-800/30',
        ],
        outline: [
          'border border-primary-400 text-primary-700 bg-transparent',
          'hover:bg-primary-200/20 hover:text-primary-900',
          'dark:text-primary-200 dark:border-primary-300/60 dark:hover:bg-primary-800/40',
        ],
        promo: [
          'bg-accent-orange text-neutral-900 shadow-card',
          'hover:shadow-glow hover:brightness-[1.03]',
        ],
        destructive: [
          'bg-accent-red text-white shadow-card',
          'hover:bg-accent-red/90 focus-visible:ring-accent-red/40',
        ],
      },
      size: {
        sm: 'px-4 py-2 text-small rounded-xl',
        default: 'px-5 py-2.5 text-body',
        lg: 'px-6 py-3 text-h4',
        xl: 'px-7 py-3.5 text-h3',
        icon: 'p-2.5 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'size'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.96 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        {...props}
      >
        {loading && (
          <motion.span
            className="mr-2 inline-flex"
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" role="presentation">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V2.5A9.5 9.5 0 002.5 12H4zm2 5.3A7.96 7.96 0 014 12H2.5A9.5 9.5 0 0011 21.5v-2.2a8.03 8.03 0 01-5-1.96z"
              />
            </svg>
          </motion.span>
        )}

        {leftIcon && !loading && <span className="flex-shrink-0 text-current">{leftIcon}</span>}

        <span className="truncate font-medium">{children as React.ReactNode}</span>

        {rightIcon && <span className="flex-shrink-0 text-current">{rightIcon}</span>}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
