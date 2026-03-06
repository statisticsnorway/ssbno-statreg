import { Router, type RequestHandler } from 'express'
import statisticsController from '@/api/controllers/statisticsController'
import releasesController from '../controllers/releasesController'
import calendarController from '../controllers/calendarController'
import entraReaderController from '../controllers/entraReaderController'

const CONTROLLERS = [statisticsController, releasesController, calendarController, entraReaderController]

const ROUTE_METHODS = ['get', 'post', 'put', 'delete'] as const
const ALLOWED_METHODS = ROUTE_METHODS.map((m) => m.toUpperCase())

function registerRoutesAndCollectMetadata(router: Router, publicPaths: RegExp[], knownPaths: Set<string>) {
  for (const method of ROUTE_METHODS) {
    const original = router[method].bind(router)

    router[method] = ((path: any, ...handlers: any[]) => {
      if (typeof path === 'string') knownPaths.add(path)

      const isPublicRoute = handlers.some((h) => (h as any).__skipAuth)
      if (isPublicRoute && typeof path === 'string') {
        const pattern = '^' + path.replace(/:[^/]+/g, '[^/]+') + '$' // Convert Express-style route params (e.g. /statistics/:shortname) into a regex, that matches the same URL structure (e.g. /statistics/boliger) for public route checks
        publicPaths.push(new RegExp(pattern))
      }

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

  const publicPaths: RegExp[] = []
  const knownPaths = new Set<string>()

  registerRoutesAndCollectMetadata(inner, publicPaths, knownPaths)

  for (const controller of controllers) {
    controller(inner)
  }

  const outer = Router()

  outer.use((req, res, next) => {
    if (publicPaths.some((r) => r.test(req.path))) return next()
    return requireAuth(req, res, next)
  })

  outer.use(inner)

  outer.use((req, res) => {
    if (!ALLOWED_METHODS.includes(req.method) && knownPaths.has(req.path)) {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    return res.status(404).json({ error: 'Not Found' })
  })

  return outer
}
