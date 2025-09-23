import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
  variant?: 'surface' | 'glass' | 'dark';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const sizeVariants = {
  sm: 'max-w-md',
  default: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl mx-4',
};

const variantStyles = {
  surface: 'bg-white text-neutral-800 border border-neutral-200 shadow-card dark:bg-neutral-900 dark:text-neutral-50 dark:border-neutral-800',
  glass: 'bg-white/90 text-neutral-800 border border-primary-500/15 shadow-glow backdrop-blur-xl dark:bg-neutral-900/80 dark:text-neutral-50',
  dark: 'bg-neutral-900 text-neutral-50 border border-neutral-700 shadow-glow',
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 24,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 16,
  },
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'default',
  variant = 'glass',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={handleOverlayClick}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn('relative w-full rounded-3xl', sizeVariants[size], variantStyles[variant], className)}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 px-6 py-5">
                <div className="space-y-1">
                  {title && <h2 className="text-h2 font-semibold text-primary-700 dark:text-primary-200">{title}</h2>}
                  {description && <p className="text-small text-neutral-500 dark:text-neutral-300">{description}</p>}
                </div>

                {showCloseButton && (
                  <Button variant="ghost" size="icon" aria-label="Fermer la fenêtre" onClick={onClose}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
              </div>
            )}

            <motion.div className="px-6 pb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('mt-6 flex flex-col gap-3 border-t border-neutral-200/60 pt-4 sm:flex-row sm:items-center sm:justify-end dark:border-neutral-700/60', className)}>
    {children}
  </div>
);

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'primary',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" variant="surface">
      <p className="text-body text-neutral-600 dark:text-neutral-200">{message}</p>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={variant === 'danger' ? 'destructive' : 'primary'} onClick={handleConfirm}>
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export { Modal, ModalFooter, ConfirmationModal };
export type { ModalProps, ConfirmationModalProps };
