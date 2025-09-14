/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Support du mode sombre avec classe
  theme: {
    extend: {
      // 🎨 ANTIGASPI DESIGN SYSTEM 2025
      // Nouvelle palette éco-responsable
      colors: {
        // Brand Colors - Vert naturel comme couleur principale
        brand: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#2E7D32', // Vert principal
          600: '#1b5e20',
          700: '#104911',
          800: '#0b3310',
          900: '#062009',
        },

        // Accent - Turquoise doux
        accent: {
          50: '#e0f7ff',
          100: '#b3ecff',
          200: '#80e1ff',
          300: '#4dd6ff',
          400: '#26ccff',
          500: '#40C4FF', // Turquoise accent
          600: '#00a5e3',
          700: '#0087c0',
          800: '#00699e',
          900: '#004d7d',
        },

        // Success/Green (pour validations)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },

        // CTA Orange
        warning: {
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#FF9800',
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',
        },

        // Error/Red
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },

        // Gray system
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          850: '#1f1f23',
          900: '#18181b',
          925: '#0f0f12',
          950: '#09090b'
        },

        // Background tones
        cream: '#FAF9F6',
        beige: '#F5F5DC'
      },

      // 📝 Typography - Inter/Poppins
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'], // Pour les titres
        mono: ['JetBrains Mono', 'Monaco', 'monospace']
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }]
      },

      // 📏 Spacing system étendu
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '17': '4.25rem',
        '18': '4.5rem',
        '19': '4.75rem',
        '21': '5.25rem',
        '22': '5.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem'
      },

      // 🎭 Shadows & Effects - optimisés pour dark mode
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'DEFAULT': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

        // Shadows spécifiques au mode sombre
        'dark-sm': '0 2px 8px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
        'dark-md': '0 4px 12px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
        'dark-lg': '0 12px 24px -4px rgb(0 0 0 / 0.6), 0 4px 8px -4px rgb(0 0 0 / 0.6)',
        'dark-xl': '0 24px 48px -8px rgb(0 0 0 / 0.7), 0 8px 16px -8px rgb(0 0 0 / 0.7)',

        // Glass morphism shadows
        'glass': '0 8px 32px 0 rgb(0 0 0 / 0.37)',
        'glass-sm': '0 4px 16px 0 rgb(0 0 0 / 0.25)',

        // Glow effects pour les accents
        'glow-brand': '0 0 20px rgb(168 85 247 / 0.4)', // Violet glow
        'glow-accent': '0 0 20px rgb(59 130 246 / 0.4)', // Bleu glow
        'glow-success': '0 0 20px rgb(34 197 94 / 0.4)', // Vert glow

        // Subtle glow for hover states
        'hover-glow': '0 4px 20px rgb(168 85 247 / 0.15)',
        'hover-glow-accent': '0 4px 20px rgb(59 130 246 / 0.15)'
      },

      // 🌊 Border radius étendu
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.5rem',
        'md': '0.625rem',
        'lg': '0.875rem',
        'xl': '1.25rem',
        '2xl': '1.75rem',
        '3xl': '2.25rem',
        '4xl': '3rem',
        'full': '9999px'
      },

      // ⏱️ Animation & Transition
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1200': '1200ms'
      },

      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-in': 'cubic-bezier(0, 0, 0.2, 1)',
        'smooth-out': 'cubic-bezier(0.4, 0, 1, 1)',
        'smooth-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
      },

      // 🎬 Animations personnalisées
      animation: {
        // Fade animations
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'fade-in-left': 'fadeInLeft 0.5s ease-out forwards',
        'fade-in-right': 'fadeInRight 0.5s ease-out forwards',

        // Scale animations
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'scale-in-bounce': 'scaleInBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',

        // Slide animations
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-down': 'slideDown 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.4s ease-out forwards',

        // Continuous animations
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',

        // Loading animations
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },

      keyframes: {
        // Fade keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },

        // Scale keyframes
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        scaleInBounce: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },

        // Slide keyframes
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },

        // Continuous animations
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pulseGlow: {
          '0%': { opacity: '0.6', transform: 'scale(1)' },
          '100%': { opacity: '1', transform: 'scale(1.02)' }
        },
        bounceSubtle: {
          '0%, 100%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0,0,0.2,1)'
          },
          '50%': {
            transform: 'translateY(-8px)',
            animationTimingFunction: 'cubic-bezier(0.8,0,1,1)'
          }
        },

        // Loading animations
        skeleton: {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '1' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: '200px 0' }
        }
      },

      // 🌊 Backdrop blur pour glassmorphism
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px'
      },

      // 🎨 Background patterns & gradients
      backgroundImage: {
        // Gradients principaux
        'gradient-brand': 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)',
        'gradient-accent': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'gradient-success': 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
        'gradient-error': 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',

        // Gradients subtils pour backgrounds
        'gradient-subtle': 'linear-gradient(135deg, rgb(168 85 247 / 0.05) 0%, rgb(59 130 246 / 0.05) 100%)',
        'gradient-dark': 'linear-gradient(135deg, rgb(39 39 42 / 0.8) 0%, rgb(24 24 27 / 0.9) 100%)',

        // Glass morphism gradients
        'gradient-glass-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'gradient-glass-dark': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',

        // Loading shimmer
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)'
      },

      // 🔥 Animation delays pour effets échelonnés
      animationDelay: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms'
      }
    },
  },

  plugins: [
    // Plugin personnalisé pour les utilitaires
    function({ addUtilities, addComponents, theme }) {
      // 🎨 Utilitaires Glassmorphism
      addUtilities({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-card': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },

        // Utilitaires de texte
        '.text-balance': {
          textWrap: 'balance',
        },

        // Scrollbar personnalisée
        '.scrollbar-thin': {
          scrollbarWidth: 'thin',
        },
        '.scrollbar-hidden': {
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },

        // Animation delays
        '.animate-delay-75': { animationDelay: '75ms' },
        '.animate-delay-100': { animationDelay: '100ms' },
        '.animate-delay-150': { animationDelay: '150ms' },
        '.animate-delay-200': { animationDelay: '200ms' },
        '.animate-delay-300': { animationDelay: '300ms' },
        '.animate-delay-500': { animationDelay: '500ms' }
      })

      // 🧩 Composants de base
      addComponents({
        // Base button class
        '.btn-base': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme('borderRadius.lg'),
          fontSize: theme('fontSize.sm')[0],
          lineHeight: theme('fontSize.sm')[1].lineHeight,
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          userSelect: 'none',
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },

        // Card base
        '.card-base': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.sm'),
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',

          '.dark &': {
            backgroundColor: theme('colors.gray.800'),
            boxShadow: theme('boxShadow.dark-sm'),
          },
        },

        // Input base
        '.input-base': {
          width: '100%',
          borderRadius: theme('borderRadius.lg'),
          borderWidth: '1px',
          borderColor: theme('colors.gray.300'),
          backgroundColor: theme('colors.white'),
          paddingTop: theme('spacing.2.5'),
          paddingBottom: theme('spacing.2.5'),
          paddingLeft: theme('spacing.3'),
          paddingRight: theme('spacing.3'),
          fontSize: theme('fontSize.sm')[0],
          lineHeight: theme('fontSize.sm')[1].lineHeight,
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',

          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.brand.500'),
            boxShadow: `0 0 0 3px ${theme('colors.brand.500')}20`,
          },

          '.dark &': {
            backgroundColor: theme('colors.gray.800'),
            borderColor: theme('colors.gray.600'),
            color: theme('colors.gray.100'),

            '&:focus': {
              borderColor: theme('colors.brand.400'),
              boxShadow: `0 0 0 3px ${theme('colors.brand.400')}20`,
            },
          },
        }
      })
    },
  ],
}