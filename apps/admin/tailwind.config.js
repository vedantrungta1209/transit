export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FFF8E5',
          400: '#FFCA5E',
          500: '#F7B32B',
          600: '#F7B32B',
          700: '#E8941A',
        },
        navy: {
          DEFAULT: '#0F2B5B',
          900: '#071633',
          800: '#0A2047',
          700: '#0F2B5B',
          600: '#163B78',
          500: '#1F4E97',
          400: '#3A6AB5',
        },
        amber: {
          DEFAULT: '#F7B32B',
          deep: '#E8941A',
          light: '#FFCA5E',
        },
        paper: '#F4F1EA',
        muted: '#5C6B86',
      },
      fontFamily: {
        sans:    ['Manrope', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
