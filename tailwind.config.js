/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9f2',
          100: '#dcf2e1',
          200: '#bce5c7',
          300: '#8cc59e',
          400: '#6bb382',
          500: '#4a9960',
          600: '#3a7a4a',
          700: '#2f613c',
          800: '#284e32',
          900: '#23412b',
        },
        secondary: {
          50: '#f4f6f6',
          100: '#e3e8e8',
          200: '#c9d3d3',
          300: '#a3b5b4',
          400: '#759090',
          500: '#5a7474',
          600: '#4d6262',
          700: '#425252',
          800: '#3a4646',
          900: '#193c39',
        },
        accent: {
          amber: '#f59e0b',
          rose: '#f43f5e',
          indigo: '#6366f1',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(26, 58, 42, 0.08), 0 4px 16px -4px rgba(26, 58, 42, 0.05)',
        'card': '0 1px 2px 0 rgba(26, 58, 42, 0.05), 0 4px 12px -2px rgba(26, 58, 42, 0.06)',
        'card-hover': '0 4px 16px -4px rgba(26, 58, 42, 0.12), 0 8px 24px -4px rgba(26, 58, 42, 0.08)',
        'glow': '0 0 0 4px rgba(74, 153, 96, 0.15)',
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
