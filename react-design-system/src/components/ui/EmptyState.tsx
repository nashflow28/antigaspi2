import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary-500/30 bg-primary-500/5 p-12 text-center shadow-card">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="text-4xl">{icon ?? '🌱'}</div>
        <h3 className="text-h2 font-semibold text-primary-700">{title}</h3>
        <p className="max-w-xl text-body text-neutral-500">{description}</p>
        {actionLabel && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export { EmptyState };
export type { EmptyStateProps };
