/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Color Palette ──────────────────────────────────────────────────────
      colors: {
        // Semantic variables mapped to index.css
        background: 'rgb(var(--color-bg) / <alpha-value>)',
        foreground: 'rgb(var(--text-main) / <alpha-value>)',
        muted:      'rgb(var(--text-muted) / <alpha-value>)',
        border:     'rgb(var(--color-border) / <alpha-value>)',
        'overlay-white': 'rgb(var(--overlay-white) / <alpha-value>)',
        
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          hover:   'rgb(var(--color-surface-hover) / <alpha-value>)',
          // Kept for backward compatibility while migrating
          50:  '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#080d1a',
        },

        // Dynamic Brand mapped to Accent Colors
        brand: {
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          // Kept for backward compatibility
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        
        accent: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // ── Animations ─────────────────────────────────────────────────────────
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-in-left':'slideInLeft 0.3s ease-out',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':      'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      // ── Border Radius ──────────────────────────────────────────────────────
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      // ── Box Shadows ────────────────────────────────────────────────────────
      boxShadow: {
        'glow-brand': '0 0 20px -5px rgba(99, 102, 241, 0.5)',
        'glow-accent': '0 0 20px -5px rgba(6, 182, 212, 0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },

      // ── Backdrop Blur ──────────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
