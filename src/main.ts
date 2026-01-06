import express, { Request, Response, type RequestHandler } from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import fs from 'node:fs'
import YAML from 'yaml'
import * as dotenv from 'dotenv'
import process from 'process'

import createControllerRouter from './api/core/controllerRouter'
import { startServer } from '../plugins/expressServer'
import { promBundleMetrics } from '../plugins/promBundle'
import { createRequireAuth, requireAudience } from '../plugins/authMiddleware'
import { prisma } from './lib/prisma'
import { initializeDepartments } from './services/klassService'

dotenv.config()

const DEVELOPMENT_MODE = process.env.npm_lifecycle_event === 'dev'

const app = express()
app.use(helmet())
app.use(promBundleMetrics)

// Public: Swagger
const file = fs.readFileSync('./openapi/openapi.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Public: root
app.get('/', (_: Request, res: Response) => res.send('STATREG-API-V1'))

// Dev bypass or real auth
const requireAuth: RequestHandler = DEVELOPMENT_MODE ? (_req, _res, next) => next() : createRequireAuth()

// Private by default (controllers can opt-out with skipAuth on specific routes)
app.use(createControllerRouter(requireAuth))

// Private endpoint (because controllerRouter applies requireAuth)
app.get('/auth/me', (req, res) => {
  res.json({
    token: req.auth?.token,
    claims: req.auth?.claims,
    username: req.auth?.username,
    email: req.auth?.email,
  })
})

// Private + aud authorization
app.get('/secret', requireAudience('oauth2-proxy-ssbno-statreg-api'), (_req, res) => {
  res.send('Very secret message!')
})

await prisma.$connect()
initializeDepartments()
startServer(app, prisma)
