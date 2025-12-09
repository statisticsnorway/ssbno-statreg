import express, { Request, Response } from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import fs from 'node:fs'
import YAML from 'yaml'
import controllerRouter from './api/core/controllerRouter'
import { startServer } from '../plugins/expressServer'
import { promBundleMetrics } from '../plugins/promBundle'
import { authMiddleware } from '../plugins/authMiddleware'
import { prisma } from './lib/prisma'
import * as dotenv from 'dotenv'
import { initializeDepartments } from './services/klassService'

//dotenv
dotenv.config()

//Express
const expressInstance = express()

//Helmet
expressInstance.use(helmet())

//Prometheus
expressInstance.use(promBundleMetrics)

// Swagger - /docs
const file = fs.readFileSync('./openapi/openapi.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
expressInstance.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

//AuthPolicy/AuthMiddleware - Routes defined before this line is public by default - be careful
expressInstance.use(authMiddleware)

//Endpoint Controller
expressInstance.use(controllerRouter)

//Test endpoints - Remove when initial testing is done
expressInstance.get('/', (_: Request, res: Response) => res.send('STATREG-API-V1'))
expressInstance.get('/secret', (_, res) => {
  res.send('Very secret message!')
})
expressInstance.get('/auth/me', (req, res) => {
  res.json({ token: (req as any).token, claims: (req as any).jwt })
})

//Initialization
await prisma.$connect()
initializeDepartments()
startServer(expressInstance, prisma)
