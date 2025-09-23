import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const rounding: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  sm: 'rounded-lg',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
  full: 'rounded-full',
};

const Skeleton: React.FC<SkeletonProps> = ({ className, rounded = 'md' }) => {
  return (
    <div className={cn('relative overflow-hidden bg-neutral-200/70 dark:bg-neutral-800/60', rounding[rounded], className)}>
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
    </div>
  );
};

export { Skeleton };
export type { SkeletonProps };
