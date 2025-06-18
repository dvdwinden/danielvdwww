/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,njk,md,js}",
    "./_site/**/*.html"
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      fontFamily: {
        sans: [
          'Degular Demo', // For headings
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ],
        'degular-text': [
          'Degular Text Demo', // For small/body text
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ],
        serif: ['Blanco Trial', 'Times New Roman', 'Times', 'Georgia', 'serif'],
      },
      fontSize: {
        sm: '1rem', // 16px
        base: '1.25rem', // 20px
        lg: '1.375rem', // 22px
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

