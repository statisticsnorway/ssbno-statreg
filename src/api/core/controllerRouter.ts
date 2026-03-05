import { Router, type RequestHandler } from 'express'
import statisticsController from '@/api/controllers/statisticsController'
import releasesController from '../controllers/releasesController'
import calendarController from '../controllers/calendarController'

const CONTROLLERS = [statisticsController, releasesController, calendarController]

const ROUTE_METHODS = ['get', 'post', 'put', 'delete'] as const
const ALLOWED_METHODS = ROUTE_METHODS.map((m) => m.toUpperCase())

function registerRoutesAndCollectMetadata(router: Router, publicPaths: Set<string>, knownPaths: Set<string>) {
  for (const method of ROUTE_METHODS) {
    const original = router[method].bind(router)

    router[method] = ((path: any, ...handlers: any[]) => {
      if (typeof path === 'string') knownPaths.add(path)

      const isPublicRoute = handlers.some((h) => (h as any).__skipAuth)
      if (isPublicRoute && typeof path === 'string') publicPaths.add(path)

      // remove skip marker from execution chain
      const routeHandlers = handlers.filter((h) => !(h as any).__skipAuth)

      return original(path, ...routeHandlers)
    }) as Router[typeof method]
  }
}

export default function controllerRouter(
  requireAuth: RequestHandler,
  // eslint-disable-next-line no-unused-vars
  controllers: ReadonlyArray<(router: Router) => void> = CONTROLLERS
) {
  const inner = Router()

  const publicPaths = new Set<string>()
  const knownPaths = new Set<string>()

  // patch only for collecting metadata + registering routes normally
  registerRoutesAndCollectMetadata(inner, publicPaths, knownPaths)

  for (const controller of controllers) {
    controller(inner)
  }

  const outer = Router()

  // auth runs BEFORE routes
  outer.use((req, res, next) => {
    if (publicPaths.has(req.path)) return next()
    return requireAuth(req, res, next)
  })

  outer.use(inner)

  // decide 405 vs 404 only AFTER routing failed
  outer.use((req, res) => {
    if (!ALLOWED_METHODS.includes(req.method) && knownPaths.has(req.path)) {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    return res.status(404).json({ error: 'Not Found' })
  })

  return outer
}
