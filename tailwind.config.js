/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Cancer Care Baskets brand palette — warm, compassionate rose/pink
        ccb: {
          50: '#fdf2f6',
          100: '#fce7ef',
          200: '#fbcfe0',
          300: '#f8a9c6',
          400: '#f175a3',
          500: '#e54b85', // primary
          600: '#d12d6c',
          700: '#b01f57',
          800: '#921d4b',
          900: '#7a1c41',
        },
        ink: {
          DEFAULT: '#2b2230',
          soft: '#6b6470',
        },
      },
      fontFamily: {
        // Match cancercarebaskets.org: Georgia serif for display/body,
        // Helvetica Neue / Arial sans for labels, buttons, and UI chrome.
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(43,34,48,0.04), 0 8px 24px rgba(43,34,48,0.06)',
      },
    },
  },
  plugins: [],
}
