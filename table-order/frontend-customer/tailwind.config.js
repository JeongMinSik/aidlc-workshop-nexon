/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F0',
          100: '#FFE8DB',
          200: '#FFD0B5',
          300: '#FFB088',
          400: '#FF8C57',
          500: '#FF6B35',
          600: '#E85D2C',
          700: '#C44D24',
          800: '#9C3D1C',
          900: '#7A3017',
        },
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FFB800',
          600: '#D97706',
        },
      },
      fontFamily: {
        sans: ['Noto Sans KR', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.06)',
        'medium': '0 4px 16px rgba(0,0,0,0.08)',
        'strong': '0 8px 32px rgba(0,0,0,0.12)',
        'glow': '0 0 20px rgba(255,107,53,0.3)',
      },
    },
  },
  plugins: [],
}
