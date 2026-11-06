// tailwind.config.js
// Configures Tailwind CSS with PortalHQ brand colors and design tokens.

/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind which files to scan for class names
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand color palette
        primary: {
          DEFAULT: '#121358',
          50: '#eeeeff',
          100: '#d5d5ff',
          200: '#adadff',
          300: '#8585f5',
          400: '#5d5de8',
          500: '#3535cc',
          600: '#232F72',
          700: '#121358',
          800: '#0a0b3a',
          900: '#03041e',
        },
        secondary: {
          DEFAULT: '#232F72',
          light: '#2F578A',
        },
        tertiary: {
          DEFAULT: '#2F578A',
        },
        accent: {
          DEFAULT: '#36ADA3',
          50: '#e6f7f6',
          100: '#c3ebe9',
          200: '#8ed6d3',
          300: '#5ec2bd',
          400: '#36ADA3',
          500: '#28928a',
          600: '#1e7870',
          700: '#165e57',
          800: '#0e443e',
          900: '#062a26',
        },
        // Semantic colors mapped to brand
        surface: '#FFFFFF',
        background: '#F8FAFC',
      },
      fontFamily: {
        // Use Inter as the primary font
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
};
