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

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  header,
  className
}) => {
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
    <div className={cn("min-h-screen bg-gray-950", className)}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50",
          "transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        initial={false}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-800/50">
            {sidebar.brand.logo && (
              <div className="flex-shrink-0 w-8 h-8">
                {sidebar.brand.logo}
              </div>
            )}
            <h1 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
              {sidebar.brand.name}
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {sidebar.navigation.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  "hover:bg-white/5 hover:text-white",
                  item.active
                    ? "bg-brand-500/20 text-white border border-brand-500/30"
                    : "text-gray-300 hover:bg-gray-800/50"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-1 text-xs font-semibold bg-brand-500/20 text-brand-300 rounded-full">
                    {item.badge}
                  </span>
                )}
              </motion.a>
            ))}
          </nav>

          {/* Sidebar Footer */}
          {sidebar.footer && (
            <div className="p-4 border-t border-gray-800/50">
              {sidebar.footer}
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Header */}
        <motion.header
          className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors lg:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Header Actions */}
              <div className="flex items-center gap-4 ml-auto">
                {/* Notifications */}
                {header.notifications && (
                  <div className="hidden sm:block">
                    {header.notifications}
                  </div>
                )}

                {/* Custom Actions */}
                {header.actions && (
                  <div className="hidden sm:flex items-center gap-2">
                    {header.actions}
                  </div>
                )}

                {/* User Profile */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                  {header.user.avatar ? (
                    <img
                      src={header.user.avatar}
                      alt={header.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                      {header.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">{header.user.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-32">{header.user.email}</p>
                  </div>
                  <svg className="hidden sm:block w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <motion.main
          className="flex-1 p-4 sm:p-6 lg:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export { DashboardLayout };
export type { DashboardLayoutProps };