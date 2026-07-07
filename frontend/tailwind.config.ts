import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './lib/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-primary':   '#FFFDF5', /* Cream canvas */
        'bg-secondary': '#FFFFFF',
        'bg-card':      '#FFFFFF',
        'accent-blue':   '#3b82f6',
        'accent-cyan':   '#06b6d4',
        'accent-green':  '#10b981',
        'accent-yellow': '#FFD93D',
        'accent-red':    '#FF6B6B',
        'accent-purple': '#C4B5FD',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'neo-sm': '4px 4px 0px 0px #000000',
        'neo-md': '8px 8px 0px 0px #000000',
        'neo-lg': '12px 12px 0px 0px #000000',
        'neo-xl': '16px 16px 0px 0px #000000',
      },
      borderRadius: {
        'none': '0px',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'pulse-fast': 'pulse 0.8s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
