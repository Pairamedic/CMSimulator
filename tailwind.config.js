/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // All themeable colors resolve to CSS variables (RGB channel triplets)
        // so light/dark can flip globally and Tailwind opacity modifiers still work.
        'monitor-bg': 'rgb(var(--bg) / <alpha-value>)',
        'ecg-bg':     'rgb(var(--ecg-bg) / <alpha-value>)',
        'surface':    'rgb(var(--surface) / <alpha-value>)',
        'surface2':   'rgb(var(--surface2) / <alpha-value>)',
        'ecg-border': 'rgb(var(--border) / <alpha-value>)',
        'ink':        'rgb(var(--ink) / <alpha-value>)',
        'ecg-gray':   'rgb(var(--gray) / <alpha-value>)',
        'ecg-green':  'rgb(var(--green) / <alpha-value>)',
        'ecg-amber':  'rgb(var(--amber) / <alpha-value>)',
        'ecg-red':    'rgb(var(--red) / <alpha-value>)',
        'ecg-blue':   'rgb(var(--blue) / <alpha-value>)',
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}
