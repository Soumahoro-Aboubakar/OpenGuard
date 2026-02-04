/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0284c7',
          dark: '#0369a1',
        },
        score: {
          excellent: '#10b981',
          good: '#f59e0b',
          medium: '#f97316',
          critical: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
