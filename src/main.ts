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

const requireAuth: RequestHandler = DEVELOPMENT_MODE ? (_req, _res, next) => next() : createAuthMiddleware()

// Controllers decide per endpoint if it is public or protected
app.use(createControllerRouter(requireAuth))

app.get('/auth/me', requireAuth, (req, res) => {
  res.json({
    token: req.auth?.token,
    claims: req.auth?.claims,
    username: req.auth?.username,
    email: req.auth?.email,
  })
})

app.get('/secret', requireAuth, requireAudience('oauth2-proxy-ssbno-statreg-api'), (_req, res) => {
  res.send('Very secret message!')
})

await prisma.$connect()
initializeDepartments()
startServer(app, prisma)
