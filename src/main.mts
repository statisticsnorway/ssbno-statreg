import { initializeLightship } from '@/utils/lightship'
import express from 'express'
import promBundle from 'express-prom-bundle'
import helmet from 'helmet'
import controllerRouter from '@/api/core/controllerRouter'


const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    deployment: 'ssbno-statreg-api',
    namespace: 'ssbno',
    team: 'ssbno'
  },
  promClient: {
    collectDefaultMetrics: {},
  },
})

const app = express()
app.use(helmet())
app.use(metricsMiddleware)
app.use(controllerRouter)

app.get('/', (_, res) => {
  res.send('Hello World!')
})

const port = 8080
const lightship = await initializeLightship()

app
  .listen(port, () => {
    lightship.signalReady()
    if (process.env.NODE_ENV === 'development') {
      const LOCAL_APP_URL = `http://localhost:${port}`
      console.log(`Application running on: ${LOCAL_APP_URL}`)
    }
  })
  .on('error', (err) => {
    console.log(err)
    console.log('Shutting down')
    lightship.shutdown()
  })

lightship.registerShutdownHandler(async () => {
  console.log('Server is shutting down...')
})
