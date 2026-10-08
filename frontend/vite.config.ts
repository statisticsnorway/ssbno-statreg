// import fs from 'node:fs/promises'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/docs': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
