import React, { forwardRef, useId, useState } from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const textareaVariants = cva(
  [
    'flex w-full rounded-2xl border bg-white/95 px-4 py-3 text-body text-neutral-700 transition-all duration-200 ease-spring-out',
    'placeholder:text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50',
    'dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus-visible:ring-offset-neutral-900',
    'disabled:cursor-not-allowed disabled:opacity-60 resize-y',
  ],
  {
    variants: {
      variant: {
        subtle: 'border-neutral-200 hover:border-primary-300 focus:border-primary-400 dark:border-neutral-700 dark:focus:border-primary-500',
        filled: 'border-transparent bg-neutral-100 hover:bg-neutral-50 focus:bg-white dark:bg-neutral-800/70 dark:hover:bg-neutral-800',
        transparent: 'border-primary-500/20 bg-primary-500/5 hover:border-primary-500/40 focus:bg-white dark:bg-primary-900/30 dark:border-primary-700/40',
      },
      size: {
        md: 'min-h-[120px]',
        lg: 'min-h-[180px] text-body',
      },
    },
    defaultVariants: {
      variant: 'subtle',
      size: 'md',
    },
  },
);

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, variant, size, label, error, helperText, id, ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const generatedId = useId();
  const textareaId = id ?? `textarea-${generatedId}`;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={textareaId}
          className={cn(
            'text-small font-medium text-neutral-600 transition-colors dark:text-neutral-200',
            isFocused && !error && 'text-primary-600',
            error && 'text-accent-red',
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <motion.textarea
          id={textareaId}
          ref={ref}
          className={cn(
            textareaVariants({ variant, size }),
            error && 'border-accent-red focus-visible:ring-accent-red/60',
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          onFocus={(event) => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            props.onBlur?.(event);
          }}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          {...props}
        />

        <motion.span
          className="pointer-events-none absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary-500"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0, opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      </div>

      {error ? (
        <motion.p
          id={`${textareaId}-error`}
          className="flex items-center gap-2 text-small text-accent-red"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-4a1 1 0 100 2 1 1 0 000-2zm-.75-7.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </motion.p>
      ) : helperText ? (
        <p id={`${textareaId}-helper`} className="text-caption text-neutral-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
export type { TextareaProps };
