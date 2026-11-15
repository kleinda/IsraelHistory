/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
        display: ['"Secular One"', 'Heebo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
