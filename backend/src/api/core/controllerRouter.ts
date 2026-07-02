import path from 'node:path'
import { static as staticExpress, Router, type RequestHandler } from 'express'
import { asyncLocalStorage } from '@/lib/context'
import statisticsController from '@/api/controllers/statisticsController'
import releasesController from '../controllers/releasesController'
import calendarController from '../controllers/calendarController'
import shortnamesController from '../controllers/shortnamesController'
import contactsController from '../controllers/contactsController'

const API_PREFIX = '/api'
const ROUTE_METHODS = ['get', 'post', 'put', 'delete'] as const
const ALLOWED_METHODS = new Set(ROUTE_METHODS.map((method) => method.toUpperCase()))
type RouteMethod = (typeof ROUTE_METHODS)[number]

const CONTROLLERS = [
  statisticsController,
  releasesController,
  calendarController,
  shortnamesController,
  contactsController,
]

type PublicRouteRule = {
  method: string
  pathPattern: RegExp
}

type RouteMetadata = {
  publicRoutes: PublicRouteRule[]
  knownPaths: Set<string>
}

function createRouteMetadata(): RouteMetadata {
  return {
    publicRoutes: [],
    knownPaths: new Set<string>(),
  }
}

function isSkipAuthHandler(handler: unknown): handler is { __skipAuth?: boolean } {
  return Boolean((handler as { __skipAuth?: boolean }).__skipAuth)
}

function toApiPath(routePath: string): string {
  return `${API_PREFIX}${routePath}`
}

function toPublicPathPattern(routePath: string): RegExp {
  const pattern = `^${API_PREFIX}${routePath.replace(/:[^/]+/g, '[^/]+')}/?$`
  return new RegExp(pattern)
}

function stripSkipAuthHandlers(handlers: RequestHandler[]): RequestHandler[] {
  return handlers.filter((handler) => !isSkipAuthHandler(handler))
}

function createPublicRouteRule(method: RouteMethod, routePath: string): PublicRouteRule {
  return {
    method: method.toUpperCase(),
    pathPattern: toPublicPathPattern(routePath),
  }
}

// Wrap Express route registration so we can collect metadata while controllers
// are mounted:
// - knownPaths: exact API paths used to return 405 for unsupported methods
// - publicRoutes: method/path rules for routes marked with skipAuth
// We remove skipAuth from the actual handler chain because auth is enforced
// centrally in createAuthGate.
function createTrackedRouter(metadata: RouteMetadata): Router {
  const router = Router()

  for (const method of ROUTE_METHODS) {
    const original = router[method].bind(router)

    router[method] = ((routePath: string, ...handlers: RequestHandler[]) => {
      metadata.knownPaths.add(toApiPath(routePath))

      if (handlers.some(isSkipAuthHandler)) {
        metadata.publicRoutes.push(createPublicRouteRule(method, routePath))
      }

      return original(routePath, ...stripSkipAuthHandlers(handlers))
    }) as Router[typeof method]
  }

  return router
}

function isPublicRequest(req: { method: string; path: string }, publicRoutes: PublicRouteRule[]): boolean {
  return publicRoutes.some((route) => route.method === req.method && route.pathPattern.test(req.path))
}

// Global auth middleware that decides per request:
// - public route: bypass requireAuth but still initialize request context
// - protected route: delegate to requireAuth (Keycloak or configured strategy)
function createAuthGate(requireAuth: RequestHandler, publicRoutes: PublicRouteRule[]): RequestHandler {
  return (req, res, next) => {
    const isPublic = isPublicRequest(req, publicRoutes)

    if (isPublic) {
      return asyncLocalStorage.run({}, next)
    }

    return requireAuth(req, res, next)
  }
}

// Return 405 only when the path exists but the HTTP method is not one of the
// registered API methods. Unknown paths should continue so static/fallback
// handlers can resolve them.
function createMethodGuard(knownPaths: Set<string>): RequestHandler {
  const knownPathPatterns = Array.from(knownPaths, (knownPath) => {
    const pattern = `^${knownPath.replace(/:[^/]+/g, '[^/]+')}/?$`
    return new RegExp(pattern)
  })

  return (req, res, next) => {
    const isKnownPath = knownPathPatterns.some((pattern) => pattern.test(req.path))

    if (!ALLOWED_METHODS.has(req.method) && isKnownPath) {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    next()
  }
}

export default function controllerRouter(
  requireAuth: RequestHandler,
  controllers: ReadonlyArray<(router: Router) => void> = CONTROLLERS
) {
  const metadata = createRouteMetadata()
  const apiRouter = createTrackedRouter(metadata)

  for (const controller of controllers) {
    controller(apiRouter)
  }

  const router = Router()

  router.use(createAuthGate(requireAuth, metadata.publicRoutes))
  router.use(API_PREFIX, apiRouter)
  router.use(staticExpress(path.resolve(__dirname))) // Resolves assets and favicon
  router.get('/*splat', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html')) // Delivers packaged React payload from Express
  })
  router.use(createMethodGuard(metadata.knownPaths))

  return router
}
