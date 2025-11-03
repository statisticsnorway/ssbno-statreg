import { createLightship, Lightship } from 'lightship'

let lightship: Lightship

export async function initializeLightship(): Promise<Lightship> {
  if (!lightship) {
    lightship = await createLightship({
      // eslint-disable-next-line no-undef
      detectKubernetes: process.env.NODE_ENV !== 'development',
      port: 9000,
      shutdownDelay: 5000,
      gracefulShutdownTimeout: 30000,
    })

    // Graceful shutdown handler
    lightship.registerShutdownHandler(() => {
      console.log('Graceful shutdown initiated...')
      lightship.shutdown()
    })

    lightship.signalReady()
  }
  return lightship
}
