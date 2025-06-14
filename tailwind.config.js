/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,njk,md,js}",
    "./_site/**/*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Blanco Trial', 'Times New Roman', 'Times', 'Georgia', 'serif'],
        sans: ['Degular Demo', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        lg: '1.25rem', // 20px
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
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

