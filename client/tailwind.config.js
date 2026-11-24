/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors.js';

const colorsWithoutAliases = Object.fromEntries(
  Object.keys(colors)
    .filter((name) => !['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray'].includes(name))
    .map((name) => [name, colors[name]])
);

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      ...colorsWithoutAliases,
      slate: {
        50: 'var(--slate-50)',
        100: 'var(--slate-100)',
        200: 'var(--slate-200)',
        300: 'var(--slate-300)',
        400: 'var(--slate-400)',
        500: 'var(--slate-500)',
        600: 'var(--slate-600)',
        700: 'var(--slate-700)',
        800: 'var(--slate-800)',
        900: 'var(--slate-900)',
        950: 'var(--slate-950)',
      },
      campus: {
        50: 'var(--campus-50)',
        100: 'var(--campus-100)',
        200: 'var(--campus-200)',
        300: 'var(--campus-300)',
        400: 'var(--campus-400)',
        500: 'var(--campus-500)',
        600: 'var(--campus-600)',
        700: 'var(--campus-700)',
        800: 'var(--campus-800)',
        900: 'var(--campus-900)',
        950: 'var(--campus-950)',
      }
    },
  },
  plugins: [],
}
