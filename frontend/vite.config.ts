import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TODO: Fix proxy after routing strategy is decided
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/statistikkregisteret/',
  server: {
    port: 5173,
    proxy: {
      '/statistikkregisteret/api/releases': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/statistikkregisteret/api/statistics': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
