import fs from 'node:fs'
import express from 'express'
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

const BASE_ROUTE = '/statistikkregisteret'

dotenv.config()
const auth = requireAuthorization()
const app = express()
app.use(helmet())
app.use(promBundleMetrics)
app.use(express.json())
const swaggerDocument = YAML.parse(fs.readFileSync('../shared/openapi/openapi.yaml', 'utf8'))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.get('/auth/me', auth, (req, res) => {
  // For local testing, add requireUserAuthentication here
  res.json({
    claims: req.auth?.claims,
    username: req.auth?.username,
    email: req.auth?.email,
  })
})

// Ensure entire application is served on /statistikkregisteret
app.use(BASE_ROUTE, controllerRouter(auth))

await prisma.$connect()
initializeDepartments()
startServer(app, prisma)
