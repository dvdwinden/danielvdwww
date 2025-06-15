/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,njk,md,js}",
    "./_site/**/*.html"
  ],
  theme: {
    extend: {
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
        'beige': '#f9f5ee',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

