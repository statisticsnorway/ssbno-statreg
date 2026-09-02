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
import { getAllUsersFromCache } from './lib/cache'
import * as dotenv from 'dotenv'
dotenv.config()

const APP_BASE_PATH = '/statistikkregisteret'
const DOCS_PATH = '/docs'

function normalizeSwaggerAssetPaths(html: string, docsPath: string): string {
  return html
    .replaceAll('./swagger-ui.css', `${docsPath}/swagger-ui.css`)
    .replaceAll('./swagger-ui-bundle.js', `${docsPath}/swagger-ui-bundle.js`)
    .replaceAll('./swagger-ui-standalone-preset.js', `${docsPath}/swagger-ui-standalone-preset.js`)
    .replaceAll('./swagger-ui-init.js', `${docsPath}/swagger-ui-init.js`)
    .replaceAll('./favicon-32x32.png', `${docsPath}/favicon-32x32.png`)
    .replaceAll('./favicon-16x16.png', `${docsPath}/favicon-16x16.png`)
}

export async function createApp() {
  const auth = requireAuthorization()
  const app = express()
  app.use(helmet())
  app.use(promBundleMetrics)
  app.use(express.json())
  const swaggerDocument = YAML.parse(fs.readFileSync('../shared/openapi/openapi.yaml', 'utf8'))
  const docsPath = `${APP_BASE_PATH}${DOCS_PATH}`
  const docsHtml = normalizeSwaggerAssetPaths(swaggerUi.generateHTML(swaggerDocument), docsPath)

  app.get([docsPath, `${docsPath}/`], (_req, res) => res.send(docsHtml))
  app.use(docsPath, swaggerUi.serveFiles(swaggerDocument))

  app.use(APP_BASE_PATH, createAuthRouter(auth))

  // Ensure entire application is served on /statistikkregisteret
  app.use(APP_BASE_PATH, controllerRouter(auth))

  await prisma.$connect()
  await initializeDepartments() //TODO handle error with caching solution MIM-2641
  await getAllUsersFromCache()

  return app
}
