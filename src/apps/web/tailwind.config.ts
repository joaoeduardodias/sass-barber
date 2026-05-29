import preset from '@barber/ui/tailwind-preset'
import type { Config } from 'tailwindcss'

const config: Config = {
  presets: [preset],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
}

export default config
