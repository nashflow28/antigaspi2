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
  variant?: 'default' | 'glass' | 'dark';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const sizeVariants = {
  sm: "max-w-md",
  default: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-7xl mx-4"
};

const variantStyles = {
  default: "bg-gray-900/95 border-gray-700/50",
  glass: "bg-white/5 backdrop-blur-2xl border-white/10",
  dark: "bg-black/90 border-gray-800/50"
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.75,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.75,
    y: 20
  }
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
  className
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={handleOverlayClick}
          />

          {/* Modal */}
          <motion.div
            className={cn(
              "relative w-full rounded-2xl border shadow-2xl",
              sizeVariants[size],
              variantStyles[variant],
              className
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.4,
              ease: [0.23, 1, 0.32, 1]
            }}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex-1">
                  {title && (
                    <motion.h2
                      className="text-xl font-semibold text-white mb-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      {title}
                    </motion.h2>
                  )}
                  {description && (
                    <motion.p
                      className="text-gray-400 text-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                    >
                      {description}
                    </motion.p>
                  )}
                </div>

                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                )}
              </div>
            )}

            {/* Content */}
            <motion.div
              className={cn(
                "px-6",
                (title || showCloseButton) ? "pb-6" : "py-6"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Modal Footer component
const ModalFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("flex items-center justify-end gap-3 pt-6 border-t border-gray-700/30", className)}>
    {children}
  </div>
);

// Confirmation Modal component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const confirmButtonVariant = variant === 'danger' ? 'destructive' : 'primary';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant="glass"
    >
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          {message}
        </p>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmButtonVariant}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

export { Modal, ModalFooter, ConfirmationModal };
export type { ModalProps, ConfirmationModalProps };