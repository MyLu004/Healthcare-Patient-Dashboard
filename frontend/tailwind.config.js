/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#38B2AC',       // Teal (used for buttons, active elements)
        accent: '#E6F2FF',        // Soft blue background
        danger: '#EF4444',        // Alerts (e.g., high BP)
        warning: '#F59E0B',       // Optional: fever/temp warning
        success: '#22C55E',       // Optional: good vitals
        neutral: {
          light: '#F8FAFC',       // Very light gray background
          medium: '#E2E8F0',      // Card background
          dark: '#4B5563',        // Text headings
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
