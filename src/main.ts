import fs from 'node:fs'

import express, { Request, Response } from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'

import { requireAuth } from '../plugins/authMiddleware'
import { startServer } from '../plugins/expressServer'
import { promBundleMetrics } from '../plugins/promBundle'

import controllerRouter from './api/core/controllerRouter'
import { prisma } from './lib/prisma'
import { initializeDepartments } from './services/klassService'

const app = express()

app.use(helmet())
app.use(promBundleMetrics)

const swaggerDocument = YAML.parse(fs.readFileSync('./openapi/openapi.yaml', 'utf8'))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.get('/', (_: Request, res: Response) => res.send('STATREG-API-V1'))

app.get('/auth/me', requireAuth, (req, res) => {
  res.json({
    token: req.auth?.token,
    claims: req.auth?.claims,
    username: req.auth?.username,
    email: req.auth?.email,
  })
})

app.use(controllerRouter(requireAuth))

await prisma.$connect()
initializeDepartments()
startServer(app, prisma)
