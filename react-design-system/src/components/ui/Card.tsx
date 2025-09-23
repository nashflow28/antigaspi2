import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  [
    'relative flex flex-col rounded-3xl border shadow-card transition-all duration-300 ease-spring-out',
    'bg-surface-light/95 dark:bg-neutral-900/80 border-neutral-200/70 dark:border-neutral-800/80',
    'backdrop-blur-xl overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-surface-light/95 dark:bg-neutral-900/80',
        ],
        glass: [
          'bg-primary-200/15 dark:bg-neutral-900/60 border-primary-400/20',
          'before:absolute before:inset-0 before:bg-emerald-glass before:opacity-90 before:-z-10',
        ],
        highlight: [
          'bg-primary-500/10 border-primary-400/30',
          'dark:bg-primary-800/20 dark:border-primary-600/40',
        ],
        muted: [
          'bg-neutral-50 border-neutral-200',
          'dark:bg-neutral-900 dark:border-neutral-800',
        ],
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-1 hover:shadow-glow',
        glow: 'hover:shadow-glow hover:border-primary-500/40',
        subtle: 'hover:-translate-y-0.5 hover:bg-primary-100/20',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'lift',
      padding: 'md',
    },
  },
);

interface CardProps
  extends Omit<HTMLMotionProps<'div'>, 'size'>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  className,
  variant,
  hover,
  padding,
  children,
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(cardVariants({ variant, hover, padding, className }))}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover !== 'none' ? { scale: 1.02 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
});

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 pb-4', className)} {...props} />
  ),
);

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-h3 font-semibold text-neutral-800 dark:text-neutral-50', className)}
      {...props}
    />
  ),
);

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-body text-neutral-500 dark:text-neutral-300/80', className)}
      {...props}
    />
  ),
);

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1', className)} {...props} />
  ),
);

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 border-t border-neutral-200/70 pt-4 dark:border-neutral-700/70', className)}
      {...props}
    />
  ),
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardFooter.displayName = 'CardFooter';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
export type { CardProps };
