import fs from 'node:fs/promises'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const APP_BASE_PATH = '/statistikkregisteret'
const FRONTEND_INDEX = new URL('./index.html', import.meta.url)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-base-path-without-trailing-slash',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url) {
            next()
            return
          }

          const requestUrl = new URL(req.url, 'http://localhost')
          if (requestUrl.pathname !== APP_BASE_PATH) {
            next()
            return
          }

          try {
            const template = await fs.readFile(FRONTEND_INDEX, 'utf8')
            const html = await server.transformIndexHtml(requestUrl.pathname, template)

            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
          } catch (error) {
            next(error)
          }
        })
      },
    },
  ],
  base: APP_BASE_PATH,
  server: {
    port: 5173,
    proxy: {
      '/statistikkregisteret/docs': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/statistikkregisteret/api/': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
