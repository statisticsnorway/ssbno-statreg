import { createLightship } from 'lightship'
import type express from 'express' // ← use the default import type

export async function startServer(app: express.Express) {
  const port = Number(process.env.PORT) || 8080

  const lightship = await createLightship({
    detectKubernetes: process.env.NODE_ENV !== 'development',
    port: 9000,
  })

  const server = app.listen(port, () => {
    lightship.signalReady()
    if (process.env.NODE_ENV === 'development') {
      console.log(`Server running:
        • http://localhost:${port}
        • http://localhost:${port}/statistics/`)
    }
  })

  server.on('error', (err: Error) => {
    console.error('Server error:', err)
    lightship.shutdown()
  })

  lightship.registerShutdownHandler(() => {
    console.log('Graceful shutdown initiated...')
    server.close()
  })
}
