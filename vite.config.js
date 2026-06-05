import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set the base path to match the repository name for GitHub Pages deployment
  base: process.env.NODE_ENV === 'production' ? '/proptech-intake-portal/' : '/',
})
