/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
        }
      }
    },
  },
  plugins: [],
};
