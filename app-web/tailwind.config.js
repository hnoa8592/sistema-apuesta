/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        q: {
          bg: '#f9f9f4',
          'bg-dark': '#1e2030',
          surface: '#ffffff',
          'surface-dark': '#242638',
          'surface-2': '#f4f4ee',
          'surface-2-dark': '#2a2d40',
          fg: '#1a1d2e',
          'fg-dark': '#f7f7f0',
          'fg-2': '#5a5e72',
          'fg-2-dark': '#b8bcc8',
          'fg-3': '#8e91a0',
          'fg-3-dark': '#7a7d8c',
          accent: '#9edb4f',
          'accent-dark': '#b4e866',
          'accent-soft': '#9edb4f1a',
          danger: '#d45a2a',
        }
      },
      fontFamily: {
        display: ['"Inter Tight"', 'sans-serif'],
        ui: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
    },
  },
  plugins: [],
}
