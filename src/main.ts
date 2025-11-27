import { createLightship } from 'lightship'
import express from 'express'
import promBundle from 'express-prom-bundle'
import helmet from 'helmet'
import process from 'node:process'
import swaggerUi from 'swagger-ui-express'
import fs from 'node:fs'
import YAML from 'yaml'
import * as dotenv from 'dotenv'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'

dotenv.config()

const adapter = new PrismaPg({
  connectionString: process.env.NAIS_DATABASE_MYAPP_MYDB_URL!,
})

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

const prisma = new PrismaClient({ adapter })
await prisma.$connect()

const app = express()
app.use(helmet())
app.use(metricsMiddleware)

const file = fs.readFileSync('./openapi/openapi.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.get('/secret', (_, res) => {
  res.send('Very secret message!')
})
app.get('/', (_, res) => {
  res.send('Hello World!')
})

app.get('/statistics', async (_, res) => {
  const allStatistics = await prisma.statistic.findMany()
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
