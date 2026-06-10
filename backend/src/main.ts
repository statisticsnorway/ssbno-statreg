import fs from 'node:fs'
import express from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import { type JWTPayload } from 'jose'
import { requireAuthorization } from '../plugins/authMiddleware'
import { startServer } from '../plugins/expressServer'
import { promBundleMetrics } from '../plugins/promBundle'
import controllerRouter from './api/core/controllerRouter'
import { prisma } from './lib/prisma'
import { initializeDepartments } from './services/klassService'
import * as dotenv from 'dotenv'

dotenv.config()
const auth = requireAuthorization()
const app = express()
app.use(helmet())
app.use(promBundleMetrics)
app.use(express.json())
const swaggerDocument = YAML.parse(fs.readFileSync('../shared/openapi/openapi.yaml', 'utf8'))

app.use('/statistikkregisteret/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.get('/statistikkregisteret/api/auth/me', auth, (req, res) => {
  // For local testing, add requireUserAuthentication here
  res.json({
    claims: req.auth?.claims,
    username: req.auth?.username,
    email: req.auth?.email,
  })
})

app.get('/statistikkregisteret/api/auth/authenticate', auth, (req, res) => {
  const claims = req.auth?.claims as JWTPayload & {
    dapla?: {
      groups?: string[]
    }
  }

  const claimGroups = claims.dapla?.groups

  const adminGroups = process.env.ADMIN_GROUPS?.split(',') ?? []

  res.json({
    isAdmin: adminGroups.some((group) => claimGroups?.includes(group)),
    email: req.auth?.email,
    fullName: claims.name,
  })
})

// Ensure entire application is served on /statistikkregisteret
app.use('/statistikkregisteret', controllerRouter(auth))

await prisma.$connect()
initializeDepartments()
startServer(app, prisma)
