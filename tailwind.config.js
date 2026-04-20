/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Dallas Cowboys navy — scale built around #003594
        primary: {
          50: '#e8edf5',
          100: '#cfdaeb',
          200: '#9eb5d7',
          300: '#6e90c3',
          400: '#3d6baf',
          500: '#003594',
          600: '#002e80',
          700: '#00276c',
          800: '#001f58',
          900: '#041E42',
        },
        // Cowboys silver / slate secondary — scale around #b0b7bc
        secondary: {
          50: '#f7f8f9',
          100: '#e9ebed',
          200: '#d5d8db',
          300: '#b0b7bc',
          400: '#8a9299',
          500: '#6b737a',
          600: '#555c62',
          700: '#444a4f',
          800: '#353a3e',
          900: '#25282c',
        },
        accent: {
          amber: '#f59e0b',
          rose: '#f43f5e',
          indigo: '#6366f1',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 53, 148, 0.08), 0 4px 16px -4px rgba(0, 53, 148, 0.05)',
        'card': '0 1px 2px 0 rgba(37, 40, 44, 0.05), 0 4px 12px -2px rgba(37, 40, 44, 0.06)',
        'card-hover': '0 4px 16px -4px rgba(0, 53, 148, 0.18), 0 8px 24px -4px rgba(0, 53, 148, 0.10)',
        'glow': '0 0 0 4px rgba(0, 53, 148, 0.20)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
