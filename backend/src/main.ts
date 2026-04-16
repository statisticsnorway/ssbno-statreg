import fs from 'node:fs'
import express, { Request, Response } from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import { requireAuthorization } from '../plugins/authMiddleware'
import { startServer } from '../plugins/expressServer'
import { promBundleMetrics } from '../plugins/promBundle'
import controllerRouter from './api/core/controllerRouter'
import { prisma } from './lib/prisma'
import { initializeDepartments } from './services/klassService'
import * as dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()
const auth = requireAuthorization()
const app = express()
app.use(cors())
app.use(helmet())
app.use(promBundleMetrics)
app.use(express.json())
const swaggerDocument = YAML.parse(fs.readFileSync('./openapi/openapi.yaml', 'utf8'))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.get('/', (_: Request, res: Response) => res.send('STATREG-API-V1'))
app.get('/auth/me', auth, (req, res) => {
  // For local testing, add requireUserAuthentication here
  res.json({
    claims: req.auth?.claims,
    username: req.auth?.username,
    email: req.auth?.email,
  })
})
app.use(controllerRouter(auth))
await prisma.$connect()
initializeDepartments()
startServer(app, prisma)
