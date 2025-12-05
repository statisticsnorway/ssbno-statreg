import express, { Request, Response } from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import fs from 'node:fs'
import YAML from 'yaml'
import controllerRouter from './api/core/controllerRouter'
import { startServer } from '../plugins/expressServer'
import { promBundleMetrics } from '../plugins/promBundle'
import { extractJwt } from '../plugins/authMiddleware'
import { prisma } from './lib/prisma'
import * as dotenv from 'dotenv'

dotenv.config()

const expressInstance = express()
expressInstance.use(helmet())
expressInstance.use(promBundleMetrics)
expressInstance.use(extractJwt)
expressInstance.use(controllerRouter)
// TODO: Remove when initial testing is done
expressInstance.get('/', (_: Request, res: Response) => res.send('STATREG-API-V1'))
expressInstance.get('/secret', (_, res) => {
  res.send('Very secret message!')
})

await prisma.$connect()

const file = fs.readFileSync('./openapi/openapi.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
expressInstance.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

startServer(expressInstance, prisma)


// Debug endpoint to test JWT
expressInstance.get('/whoami', (req: Request, res: Response) => {
  return res.json({
    jwt: (req as any).jwt,
  })
})
