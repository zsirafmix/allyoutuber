/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        party: {
          dark: '#0B0D17',
          card: '#151928',
          border: '#222942',
          accent: '#8B5CF6',
          cyan: '#06B6D4',
          pink: '#EC4899',
          amber: '#F59E0B',
        },
      },
      animation: {
        'float-up': 'floatUp 2.5s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        floatUp: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '1' },
          '50%': { transform: 'translateY(-60px) scale(1.2)', opacity: '0.9' },
          '100%': { transform: 'translateY(-140px) scale(1.5)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
