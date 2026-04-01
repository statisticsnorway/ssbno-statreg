import { createLightship } from 'lightship'
import type express from 'express'
import process from 'node:process'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'

export async function startServer(app: express.Express, prisma: PrismaClient) {
  const port = Number(process.env.PORT) || 8080

  const lightship = await createLightship({
    detectKubernetes: process.env.NODE_ENV !== 'development',
    port: 9000,
  })

  const server = app
    .listen(port, () => {
      lightship.signalReady()
      if (process.env.NODE_ENV === 'development') {
        const LOCAL_APP_URL = `http://localhost:${port}`

        console.log(`Application running on: ${LOCAL_APP_URL}`)
      }
    })
    .on('error', (err: Error) => {
      console.error('Server error:', err)
      lightship.shutdown()
    })

  lightship.registerShutdownHandler(async () => {
    console.log('Graceful shutdown initiated...')
    await prisma.$disconnect()
    server.close()
  })

  process.on('exit', (msg) => {
    console.log('Shutting down, with status: ' + JSON.stringify(msg))
    lightship.shutdown()
  })
}
