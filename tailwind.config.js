/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F6FFF',
          dark: '#0047AB',
          light: '#EAF4FF',
        },
        background: '#F8FAFC',
        card: '#FFFFFF',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        text: {
          primary: '#0F172A',
          secondary: '#475569',
        },
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
