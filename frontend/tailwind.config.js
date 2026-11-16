/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        canvas: token('canvas'),
        fill: token('fill'),
        line: token('line'),
        ink: { DEFAULT: token('ink'), 2: token('ink-2'), 3: token('ink-3') },
        mark: token('mark'),
      },
    },
  },
}
