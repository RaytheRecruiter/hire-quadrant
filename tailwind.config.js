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
        // Nexegin spruce (deep teal) - base #066f68 (6.0:1 on white). 500 is the lightest shade safe for text on white (4.7:1).
        primary: {
          50: '#f1f9f8',
          100: '#daf1ef',
          200: '#b4e4e1',
          300: '#7bd5cf',
          400: '#31c4ba',
          500: '#088179',
          600: '#066f68',
          700: '#065b55',
          800: '#064742',
          900: '#052e2b',
        },
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
          signal: '#E8631A',      // decorative / large UI only (3.4:1 on white)
          signalText: '#B84A0C',  // safe for text on white (5.2:1)
        },
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(6, 111, 104, 0.08), 0 4px 16px -4px rgba(6, 111, 104, 0.05)',
        'card': '0 1px 2px 0 rgba(37, 40, 44, 0.05), 0 4px 12px -2px rgba(37, 40, 44, 0.06)',
        'card-hover': '0 4px 16px -4px rgba(6, 111, 104, 0.18), 0 8px 24px -4px rgba(6, 111, 104, 0.10)',
        'glow': '0 0 0 4px rgba(6, 111, 104, 0.20)',
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
