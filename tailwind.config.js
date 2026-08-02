import oroPreset from '@oro/tokens/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [oroPreset],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
