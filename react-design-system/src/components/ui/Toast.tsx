import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Button } from './Button';

type ToastTone = 'success' | 'info' | 'warning' | 'error';

interface ToastProps {
  isOpen: boolean;
  tone?: ToastTone;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

const toneStyles: Record<ToastTone, { border: string; icon: React.ReactNode }> = {
  success: {
    border: 'border-primary-500',
    icon: (
      <svg className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 10-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  info: {
    border: 'border-accent-blue',
    icon: (
      <svg className="h-5 w-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 6a9 9 0 110 18 9 9 0 010-18z" />
      </svg>
    ),
  },
  warning: {
    border: 'border-accent-orange',
    icon: (
      <svg className="h-5 w-5 text-accent-orange" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.598c.75 1.335-.213 2.999-1.742 2.999H3.48c-1.53 0-2.492-1.664-1.742-2.999L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  error: {
    border: 'border-accent-red',
    icon: (
      <svg className="h-5 w-5 text-accent-red" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-9a1 1 0 00-1-1H8a1 1 0 100 2h4a1 1 0 001-1zm-4 4a1 1 0 112 0 1 1 0 01-2 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

const Toast: React.FC<ToastProps> = ({ isOpen, tone = 'success', title, description, actionLabel, onAction, onClose }) => {
  const { border, icon } = toneStyles[tone];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn('pointer-events-auto fixed inset-x-4 bottom-6 z-50 flex justify-center sm:inset-x-auto sm:right-6', 'sm:w-[360px]')}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className={cn('flex w-full items-start gap-3 rounded-3xl border-l-4 bg-white p-4 shadow-toast dark:bg-neutral-900', border)} role="status">
            <span aria-hidden="true" className="mt-1">{icon}</span>
            <div className="flex-1 space-y-1">
              {title && <p className="text-small font-semibold text-neutral-800 dark:text-neutral-100">{title}</p>}
              {description && <p className="text-caption text-neutral-500 dark:text-neutral-300">{description}</p>}
              {actionLabel && (
                <Button variant="ghost" size="sm" className="px-0 text-primary-600" onClick={onAction}>
                  {actionLabel}
                </Button>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl p-2 text-neutral-400 transition hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              aria-label="Fermer la notification"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { Toast };
export type { ToastProps };
