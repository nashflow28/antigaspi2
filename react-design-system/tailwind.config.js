/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        accent: {
          blue: '#3B82F6',
          orange: '#FB923C',
          red: '#EF4444',
        },
        surface: {
          light: '#FFFFFF',
          muted: '#F3F4F6',
          dark: '#111827',
          darker: '#0B1120',
        },
        overlay: 'rgba(15, 23, 42, 0.6)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        small: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        body: ['1rem', { lineHeight: '1.6rem', fontWeight: '400' }],
        h4: ['1.125rem', { lineHeight: '1.6rem', fontWeight: '500' }],
        h3: ['1.25rem', { lineHeight: '1.6rem', fontWeight: '600' }],
        h2: ['1.5rem', { lineHeight: '1.9rem', fontWeight: '600' }],
        h1: ['2rem', { lineHeight: '2.4rem', fontWeight: '700' }],
      },
      boxShadow: {
        card: '0 20px 40px -24px rgba(16, 185, 129, 0.35)',
        glow: '0 0 0 1px rgba(16, 185, 129, 0.12), 0 12px 24px -10px rgba(4, 120, 87, 0.45)',
        toast: '0 12px 40px -20px rgba(15, 23, 42, 0.45)',
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backgroundImage: {
        'emerald-glass': 'linear-gradient(120deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.04) 100%)',
        'nav-gradient': 'linear-gradient(120deg, #10B981 0%, #047857 80%)',
      },
      transitionTimingFunction: {
        'spring-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
