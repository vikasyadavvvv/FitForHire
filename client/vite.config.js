import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/', // Correct placement for base configuration
  plugins: [
    tailwindcss()
  ]
})