import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  [
    "flex w-full rounded-xl border bg-white px-4 py-3 dark:bg-transparent",
    "text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500",
    "transition-all duration-300 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream dark:focus:ring-offset-gray-900",
    "disabled:cursor-not-allowed disabled:opacity-50"
  ],
  {
    variants: {
      variant: {
        default: [
          "border-gray-300 bg-white",
          "hover:border-gray-400",
          "focus:border-brand-500/50 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-gray-900/80"
        ],
        glass: [
          "border-white/40 bg-white/30 backdrop-blur-xl dark:border-gray-600 dark:bg-gray-800/30",
          "hover:border-white/50 hover:bg-white/40 dark:hover:border-gray-500 dark:hover:bg-gray-800/40",
          "focus:border-brand-400/50 focus:ring-brand-400/20"
        ],
        filled: [
          "border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/80",
          "hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-700/80",
          "focus:border-brand-500 focus:ring-brand-500/30"
        ]
      },
      size: {
        sm: "h-10 px-3 py-2 text-sm",
        default: "h-12 px-4 py-3 text-sm",
        lg: "h-14 px-6 py-4 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        {label && (
          <motion.label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium transition-colors duration-200",
              error ? "text-red-400" : "text-gray-300",
              isFocused && !error && "text-brand-400"
            )}
            animate={{ color: isFocused && !error ? "#a855f7" : error ? "#f87171" : "#d1d5db" }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <motion.input
            id={inputId}
            className={cn(
              inputVariants({ variant, size }),
              leftIcon && "pl-12",
              rightIcon && "pr-12",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            {...(props as any)}
          />

          {rightIcon && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
              {rightIcon}
            </div>
          )}

          {/* Focus indicator */}
          <motion.div
            className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: isFocused ? 1 : 0,
              opacity: isFocused ? 1 : 0
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {error && (
          <motion.p
            className="text-sm text-red-400 flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
export type { InputProps };