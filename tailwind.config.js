/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'ecg-bg':      '#050810',
        'monitor-bg':  '#0d0f12',
        'surface':     '#141720',
        'surface2':    '#1c2030',
        'ecg-border':  '#252a3a',
        'ecg-green':   '#00e5a0',
        'ecg-amber':   '#f5a623',
        'ecg-red':     '#e05252',
        'ecg-blue':    '#4a9eff',
        'ecg-gray':    '#8892aa',
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}
