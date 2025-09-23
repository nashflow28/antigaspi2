import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
      onClick={() => setIsDark((prev) => !prev)}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="h-5 w-5"
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {isDark ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a9 9 0 009 9c0 4.97-4.03 9-9 9a9 9 0 010-18z" />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.02 5.66l-.7-.7M6.34 6.34l-.7-.7m12.02 12.02l-.7-.7M6.34 17.66l-.7-.7M12 8a4 4 0 100 8 4 4 0 000-8z"
          />
        )}
      </motion.svg>
    </Button>
  );
};

export { ThemeToggle };
