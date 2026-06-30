import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://eleanorjboyd.github.io/world-cup-bracket/ on GitHub Pages,
// so production assets need that base path. Dev keeps the root path.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/world-cup-bracket/' : '/',
  plugins: [react()],
}))
