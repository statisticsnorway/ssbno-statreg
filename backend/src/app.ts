import fs from 'node:fs'
import express from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import { requireAuthorization } from '../plugins/authMiddleware'
import { promBundleMetrics } from '../plugins/promBundle'
import createAuthRouter from './api/core/authRouter'
import controllerRouter from './api/core/controllerRouter'
import { prisma } from './lib/prisma'
import { initializeDepartments } from './services/klassService'
import { getUsersFromCache } from './lib/cache'
import * as dotenv from 'dotenv'
dotenv.config()

const APP_BASE_PATH = '/statistikkregisteret'
const DOCS_PATH = '/docs'

export async function createApp() {
  const auth = requireAuthorization()
  const app = express()
  app.use(helmet())
  app.use(promBundleMetrics)
  app.use(express.json())
  const swaggerDocument = YAML.parse(fs.readFileSync('../shared/openapi/openapi.yaml', 'utf8'))

  app.use(`${APP_BASE_PATH}${DOCS_PATH}`, swaggerUi.serve, swaggerUi.setup(swaggerDocument))

  app.use(APP_BASE_PATH, createAuthRouter(auth))

  // Ensure entire application is served on /statistikkregisteret
  app.use(APP_BASE_PATH, controllerRouter(auth))

  await prisma.$connect()
  await initializeDepartments() //TODO handle error with caching solution MIM-2641
  await getUsersFromCache()

  return app
}
