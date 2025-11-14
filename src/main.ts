import { createLightship } from 'lightship'
import express from 'express'
import promBundle from 'express-prom-bundle'
import helmet from 'helmet'
import process from 'node:process'
import * as dotenv from 'dotenv'

// import { PrismaClient } from '@prisma/client'
import { PrismaClient } from '../generated/prisma/client.js'

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    deployment: 'ssbno-statreg-api',
    namespace: 'ssbno',
    team: 'ssbno',
  },
  promClient: {
    collectDefaultMetrics: {},
  },
})

const app = express()
app.use(helmet())
app.use(metricsMiddleware)

app.get('/', (_, res) => {
  res.send('Hello World!')
})

dotenv.config()
const prisma = new PrismaClient()
await prisma.$connect()

app.get('/statistics', async (_, res) => {
  const allStatistics = await prisma.statistikk.findMany()
  console.log(JSON.stringify(allStatistics, null, 2))
  res.send(allStatistics)
})

const port = 8080

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
  .on('error', (err) => {
    console.log(err)
    lightship.shutdown()
  })

// Graceful shutdown handler
lightship.registerShutdownHandler(async () => {
  console.log('Graceful shutdown initiated...')
  await prisma.$disconnect()
  server.close()
})

process.on('exit', (msg) => {
  console.log('Shutting down, with status: ' + JSON.stringify(msg))
  lightship.shutdown()
})
