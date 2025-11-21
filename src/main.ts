import { createLightship } from 'lightship'
import express from 'express'
import promBundle from 'express-prom-bundle'
import helmet from 'helmet'
import process from 'node:process'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../openapi/openapi'

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

const openapiDocument = YAML.load('.openapi/openapi.yaml')
// Serve spec directly
app.get('/openapi.json', (req, res) => {
  res.json(openapiDocument)
})

// Serve Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.get('/statistics', (_, res) => {
  res.send('Hello Statistics!!')
})
app.get('/secret', (_, res) => {
  res.send('Very secret message!')
})
app.get('/', (_, res) => {
  res.send('Hello World!')
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
  // await prisma.$disconnect()
  server.close()
})

process.on('exit', (msg) => {
  console.log('Shutting down, with status: ' + JSON.stringify(msg))
  lightship.shutdown()
})
