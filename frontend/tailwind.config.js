/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
        mono: ['monospace'],
      },
      colors: {
        atelier: {
          beige: '#F5F2EB',      // Primary page bg
          cream: '#FAF8F5',      // High contrast card/section bg
          dark: '#111111',       // Text & main actions
          gray: '#706E6B',       // Subtitles, secondary text
          lightgray: '#E5E2DA',  // Borders, dividers
          accent: '#A89685',     // Accent color (tan/gold tones)
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}
