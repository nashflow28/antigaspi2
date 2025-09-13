import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "font-medium transition-all duration-300 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900",
    "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
    "transform hover:scale-[1.02] active:scale-[0.98]",
    "relative overflow-hidden"
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r from-brand-500 to-brand-600",
          "text-white shadow-lg shadow-brand-500/25",
          "hover:from-brand-600 hover:to-brand-700",
          "hover:shadow-xl hover:shadow-brand-500/40",
          "focus:ring-brand-500/50",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0",
          "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
        ],
        secondary: [
          "bg-gradient-to-r from-accent-500 to-accent-600",
          "text-white shadow-lg shadow-accent-500/25",
          "hover:from-accent-600 hover:to-accent-700",
          "hover:shadow-xl hover:shadow-accent-500/40",
          "focus:ring-accent-500/50"
        ],
        outline: [
          "border-2 border-brand-500/30 bg-transparent",
          "text-brand-400 backdrop-blur-sm",
          "hover:border-brand-500 hover:bg-brand-500/10",
          "hover:text-brand-300 hover:shadow-lg hover:shadow-brand-500/20",
          "focus:ring-brand-500/30"
        ],
        ghost: [
          "bg-transparent text-gray-300",
          "hover:bg-white/5 hover:text-white",
          "focus:ring-white/20"
        ],
        destructive: [
          "bg-gradient-to-r from-red-500 to-red-600",
          "text-white shadow-lg shadow-red-500/25",
          "hover:from-red-600 hover:to-red-700",
          "hover:shadow-xl hover:shadow-red-500/40",
          "focus:ring-red-500/50"
        ]
      },
      size: {
        sm: "px-3 py-2 text-sm rounded-lg gap-2",
        default: "px-4 py-2.5 text-sm rounded-xl gap-2",
        lg: "px-6 py-3 text-base rounded-xl gap-3",
        xl: "px-8 py-4 text-lg rounded-2xl gap-3",
        icon: "p-2.5 rounded-xl"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "size">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        {...props}
      >
        {loading && (
          <motion.div
            className="mr-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </motion.div>
        )}

        {leftIcon && !loading && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}

        <span className="truncate">{children as React.ReactNode}</span>

        {rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };