/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B0F19',       // Deep sleek space background
          darker: '#06080F',     // Darkest panels
          accent: '#4F46E5',     // Elegant Indigo
          neonBlue: '#38BDF8',   // Sky/Neon matching
          neonPurple: '#A855F7', // Magenta matching
          success: '#10B981',    // Emerald green
          warning: '#F59E0B',    // Amber
          error: '#EF4444',      // Soft red
          card: 'rgba(17, 24, 39, 0.7)', // Glass panel background
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        neon: '0 0 15px rgba(56, 189, 248, 0.4)',
        neonPurple: '0 0 15px rgba(168, 85, 247, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
