import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar: {
    brand: {
      name: string;
      logo?: React.ReactNode;
    };
    navigation: Array<{
      label: string;
      href: string;
      icon: React.ReactNode;
      active?: boolean;
      badge?: string;
    }>;
    footer?: React.ReactNode;
  };
  header: {
    user: {
      name: string;
      email: string;
      avatar?: string;
    };
    notifications?: React.ReactNode;
    actions?: React.ReactNode;
  };
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, sidebar, header, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className={cn('min-h-screen bg-neutral-50 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-50', className)}>
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform border-r border-primary-500/10 bg-white/95 shadow-card dark:border-neutral-800 dark:bg-neutral-900/95',
          'transition-transform duration-300 ease-spring-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        initial={false}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-6 py-6 border-b border-neutral-200/70 dark:border-neutral-800/80">
            {sidebar.brand.logo && <div className="h-10 w-10 rounded-2xl bg-primary-500/15 text-primary-700 dark:text-primary-200 flex items-center justify-center">{sidebar.brand.logo}</div>}
            <h1 className="text-h3 font-semibold text-primary-800 dark:text-primary-200">{sidebar.brand.name}</h1>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {sidebar.navigation.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-4 py-3 text-small font-medium transition-all duration-200',
                  item.active
                    ? 'bg-primary-500/10 text-primary-700 shadow-inner dark:text-primary-100'
                    : 'text-neutral-500 hover:bg-primary-200/20 hover:text-primary-700 dark:text-neutral-300 dark:hover:text-primary-100',
                )}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ x: 4 }}
              >
                <span className="flex h-5 w-5 items-center justify-center text-current">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-primary-500/20 px-2 py-1 text-caption font-semibold text-primary-700 dark:text-primary-100">
                    {item.badge}
                  </span>
                )}
              </motion.a>
            ))}
          </nav>

          {sidebar.footer && <div className="border-t border-neutral-200/70 p-4 dark:border-neutral-800">{sidebar.footer}</div>}
        </div>
      </motion.aside>

      <div className="lg:ml-72">
        <motion.header
          className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/80 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-900/80"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-2xl p-2 text-primary-700 transition-colors hover:bg-primary-200/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex flex-1 items-center justify-end gap-3">
                {header.notifications && <div className="hidden sm:block">{header.notifications}</div>}
                {header.actions && <div className="hidden items-center gap-2 sm:flex">{header.actions}</div>}
                <div className="flex items-center gap-3 rounded-2xl bg-primary-500/10 px-3 py-2 text-left text-primary-800 transition-colors hover:bg-primary-500/15 dark:bg-primary-500/10 dark:text-primary-100">
                  {header.user.avatar ? (
                    <img src={header.user.avatar} alt={header.user.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white">
                      {header.user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-small font-semibold">{header.user.name}</p>
                    <p className="text-caption text-primary-700/80 dark:text-primary-100/70">{header.user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.main
          className="flex-1 px-4 py-6 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export { DashboardLayout };
export type { DashboardLayoutProps };
