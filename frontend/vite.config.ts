import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TODO: Fix proxy after routing strategy is decided
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: 'assets',
    outDir: 'dist/statistikkregisteret',
  },
  server: {
    port: 5173,
    proxy: {
      '/statistikkregisteret/releases': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/statistikkregisteret/statistics': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
