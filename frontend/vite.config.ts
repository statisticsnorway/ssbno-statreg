import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TODO: Fix proxy after routing strategy is desided
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/releases': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/statistics': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
