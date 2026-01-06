import express, { Request, Response } from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import fs from 'node:fs'
import YAML from 'yaml'
import * as dotenv from 'dotenv'
import process from 'process'

import controllerRouter from './api/core/controllerRouter'
import { startServer } from '../plugins/expressServer'
import { promBundleMetrics } from '../plugins/promBundle'
import { createAuthMiddleware, requireAudience } from '../plugins/authMiddleware'
import { prisma } from './lib/prisma'
import { initializeDepartments } from './services/klassService'

dotenv.config()

const DEVELOPMENT_MODE = process.env.npm_lifecycle_event === 'dev'

const app = express()
app.use(helmet())
app.use(promBundleMetrics)

const file = fs.readFileSync('./openapi/openapi.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.get('/', (_: Request, res: Response) => res.send('STATREG-API-V1'))

// ---- AUTH (everything below is protected by default) ----
if (!DEVELOPMENT_MODE) {
  app.use(createAuthMiddleware())
}

// Protected: controller routes
app.use(controllerRouter)

// Example protected endpoints
app.get('/auth/me', (req, res) => {
  res.json({
    token: req.auth?.token,
    claims: req.auth?.claims,
    username: req.auth?.username,
    email: req.auth?.email,
  })
})

// Example: protected + authorized by "aud"
app.get('/secret', requireAudience('oauth2-proxy-ssbno-statreg-api'), (_req, res) => {
  res.send('Very secret message!')
})

// Initialization
await prisma.$connect()
initializeDepartments()
startServer(app, prisma)
