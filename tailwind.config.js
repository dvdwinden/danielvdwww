/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,njk,md,js}",
    "./_site/**/*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Degular',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        serif: ['Blanco', 'Times New Roman', 'Times', 'Georgia', 'serif'],
        'degular': ['Degular', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        xs: '0.875rem', // 14px
        sm: '1rem', // 16px
        base: '1.25rem', // 20px
        lg: '1.375rem', // 22px
        xl: '1.5rem', // 24px
      },
      lineHeight: {
        normal: '1.5', // 150%
        none: '1', // 100%
      },
      typography: {
        DEFAULT: {
          css: {
            fontSize: '1.25rem', // 20px
            lineHeight: '1.5',
            '.article-footer': {
              'font-size': '1rem',
              'line-height': '1.5',
              'font-family': 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              'margin-top': '2rem',
              'color': 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
        invert: {
          css: {
            '.article-footer': {
              'color': 'rgba(255, 255, 255, 0.4)',
            },
          },
        },
      },
      colors: {
        'beige': '#fcf8e8',
        'brown': '#7c5e00',
        'green': '#e8f0e8',
        'stone': '#e8e6e0',
        'blue': '#f5f7fa',
        'red': '#fae8e8',
        'black': '#2a2a28',
        'hover': '#4a5568',
        'hover-dark': '#a0aec0',
        'highlight': '#fff9a8',
        'purple': '#faf0f5',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

