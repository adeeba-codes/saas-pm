/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class', // toggled by adding/removing "dark" class on <html>
  theme: {
    extend: {
      colors: {
        // A calm indigo/slate palette, similar to Linear/Notion's restraint
        // rather than loud SaaS-template gradients.
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
};
