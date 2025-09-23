import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { cn } from '../../utils/cn';
import { ThemeToggle } from './ThemeToggle';

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
}

const Navigation: React.FC<NavigationProps> = ({ brand, items, actions, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b border-primary-500/15 backdrop-blur-xl transition-all duration-300 ease-spring-out',
        'bg-nav-gradient/95 supports-[backdrop-filter]:bg-nav-gradient/90 text-white',
        scrolled && 'shadow-glow',
        className,
      )}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-50/80">
          {brand.logo && (
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
              {brand.logo}
            </span>
          )}
          <span className="text-h3 font-semibold tracking-tight drop-shadow-sm">{brand.name}</span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              className={cn(
                'relative flex items-center gap-2 rounded-full px-4 py-2 text-small font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                item.active
                  ? 'bg-white/15 text-white shadow-card'
                  : 'text-white/80 hover:text-white hover:bg-white/10',
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >
              {item.icon && <span className="h-4 w-4">{item.icon}</span>}
              <span>{item.label}</span>
              {item.active && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute inset-x-4 bottom-1 h-0.5 rounded-full bg-white/80"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {actions}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={isOpen}
            aria-label="Ouvrir la navigation"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="border-t border-white/10 bg-neutral-900 text-neutral-50 lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="space-y-2 px-4 py-4">
              {items.map((item) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-body font-medium transition-colors',
                    item.active
                      ? 'bg-primary-500/20 text-primary-50'
                      : 'text-neutral-100 hover:bg-primary-500/15',
                  )}
                  onClick={() => setIsOpen(false)}
                  whileTap={{ scale: 0.97 }}
                >
                  {item.icon && <span className="h-5 w-5">{item.icon}</span>}
                  <span>{item.label}</span>
                </motion.a>
              ))}

              {actions && <div className="pt-3 border-t border-white/10 space-y-3">{actions}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export { Navigation };
export type { NavigationProps, NavigationItem };
