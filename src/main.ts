import express, { Request, Response } from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import fs from 'node:fs'
import YAML from 'yaml'
import controllerRouter from './api/core/controllerRouter'
import { startServer } from '../plugins/expressServer'
import { promBundleMetrics } from '../plugins/promBundle'
import * as dotenv from 'dotenv'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'

dotenv.config()

const adapter = new PrismaPg({
  connectionString: process.env.NAIS_DATABASE_MYAPP_MYDB_URL!,
})

const expressInstance = express()
expressInstance.use(helmet())
expressInstance.use(promBundleMetrics)
expressInstance.use(controllerRouter)
// TODO: Remove when initial testing is done
expressInstance.get('/', (_: Request, res: Response) => res.send('STATREG-API-V1'))
expressInstance.get('/secret', (_, res) => {
  res.send('Very secret message!')
})

const file = fs.readFileSync('./openapi/openapi.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
expressInstance.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const prisma = new PrismaClient({ adapter })
await prisma.$connect()

startServer(expressInstance, prisma)
