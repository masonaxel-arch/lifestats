/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#09090b',
          card: '#18181b',
          cardHover: '#202025',
          border: '#27272a',
          muted: '#71717a',
          subtle: '#3f3f46'
        },
        brand: {
          emerald: '#10b981',
          emeraldDark: '#059669',
          emeraldGlow: 'rgba(16, 185, 129, 0.25)',
          violet: '#8b5cf6',
          violetDark: '#7c3aed',
          violetGlow: 'rgba(139, 92, 246, 0.25)',
          amber: '#f59e0b',
          rose: '#f43f5e',
          cyan: '#06b6d4'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        receipt: ['Courier New', 'Courier', 'monospace']
      },
      animation: {
        'pop': 'pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'pulse-subtle': 'pulseSubtle 2.5s infinite ease-in-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s infinite linear'
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    },
  },
  plugins: [],
}
