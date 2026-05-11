import tailwindcssLogical from 'tailwindcss-logical'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,css}'],
  corePlugins: {
    preflight: false
  },
  important: '#__next',
  plugins: [tailwindcssLogical],
  theme: {
    extend: {}
  }
}

export default config