import { createLightship, Lightship } from 'lightship'
import type { Express } from 'express'

let lightship: Lightship

export async function initializeLightship(): Promise<Lightship> {
  if (!lightship) {
    lightship = await createLightship({
      detectKubernetes: process.env.NODE_ENV !== 'development',
      port: 9000,
    })

    lightship.registerShutdownHandler(() => {
      console.log('Graceful shutdown initiated...')
      lightship.shutdown()
    })

    lightship.signalReady()
  }
  return lightship
}

export async function startServer(expressInstance: Express) {
  const port = Number(process.env.PORT) || 8080
  const lightshipInstance = await initializeLightship()

  const server = expressInstance.listen(port, () => {
    lightshipInstance.signalReady()
    if (process.env.NODE_ENV === 'development') {
      console.log(`Server running at http://localhost:${port}`)
    }
  })

  server.on('error', (err) => {
    console.error('Server error:', err)
    lightshipInstance.shutdown()
  })

  lightshipInstance.registerShutdownHandler(() => {
    console.log('Shutting down...')
    server.close()
  })
}
