import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

interface NavigationProps {
  brand: {
    name: string;
    logo?: React.ReactNode;
  };
  items: NavigationItem[];
  actions?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'solid';
}

const Navigation: React.FC<NavigationProps> = ({
  brand,
  items,
  actions,
  className,
  variant = 'glass'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navVariants = {
    default: cn(
      "bg-gray-900/80 border-gray-700/50",
      scrolled && "bg-gray-900/95 shadow-2xl backdrop-blur-xl"
    ),
    glass: cn(
      "bg-white/5 border-white/10 backdrop-blur-xl",
      scrolled && "bg-white/10 shadow-2xl"
    ),
    solid: cn(
      "bg-gray-900 border-gray-800",
      scrolled && "shadow-2xl"
    )
  };

  return (
    <motion.nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300",
        navVariants[variant],
        className
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Brand */}
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {brand.logo && (
              <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10">
                {brand.logo}
              </div>
            )}
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
              {brand.name}
            </h1>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {items.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className={cn(
                  "relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  "hover:bg-white/5 hover:text-white",
                  item.active
                    ? "text-white bg-brand-500/20"
                    : "text-gray-300"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-2">
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>

                {item.active && (
                  <motion.div
                    className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"
                    layoutId="activeTab"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  />
                )}
              </motion.a>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {actions}
          </div>

          {/* Mobile menu button */}
          <motion.button
            className="lg:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="lg:hidden border-t border-gray-700/50 bg-gray-900/95 backdrop-blur-xl"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-4 py-4 space-y-2">
              {items.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                    "hover:bg-white/5 hover:text-white",
                    item.active
                      ? "text-white bg-brand-500/20"
                      : "text-gray-300"
                  )}
                  onClick={() => setIsOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                  <span>{item.label}</span>
                </motion.a>
              ))}

              {actions && (
                <motion.div
                  className="pt-4 border-t border-gray-700/50 space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  {actions}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export { Navigation };
export type { NavigationProps, NavigationItem };