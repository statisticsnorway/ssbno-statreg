import { static as staticExpress, Router, type RequestHandler } from 'express'
import { asyncLocalStorage } from '@/lib/context'
import statisticsController from '@/api/controllers/statisticsController'
import releasesController from '../controllers/releasesController'
import calendarController from '../controllers/calendarController'
import path from 'node:path'
import shortnamesController from '../controllers/shortnamesController'
import contactsController from '../controllers/contactsController'

const CONTROLLERS = [
  statisticsController,
  releasesController,
  calendarController,
  shortnamesController,
  contactsController,
]

const ROUTE_METHODS = ['get', 'post', 'put', 'delete'] as const
const ALLOWED_METHODS = ROUTE_METHODS.map((m) => m.toUpperCase())

function registerRoutesAndCollectMetadata(router: Router, publicPaths: RegExp[], knownPaths: Set<string>) {
  for (const method of ROUTE_METHODS) {
    const original = router[method].bind(router)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router[method] = ((path: any, ...handlers: any[]) => {
      if (typeof path === 'string') knownPaths.add('/api' + path)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isPublicRoute = handlers.some((h) => (h as any).__skipAuth)
      if (isPublicRoute && typeof path === 'string') {
        const pattern = '^/api' + path.replace(/:[^/]+/g, '[^/]+') + '/?$' // Convert Express-style route params (e.g. /statistics/:shortname) into a regex, that matches the same URL structure (e.g. /statistics/boliger) for public route checks
        publicPaths.push(new RegExp(pattern))
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const routeHandlers = handlers.filter((h) => !(h as any).__skipAuth)

      return original(path, ...routeHandlers)
    }) as Router[typeof method]
  }
}

export default function controllerRouter(
  requireAuth: RequestHandler,

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
    if (publicPaths.some((r) => r.test(req.path))) {
      return asyncLocalStorage.run({}, next)
    } else return requireAuth(req, res, next)
  })

  // Ensure ALL controllers are placed under path /api
  outer.use('/api', inner)

  // Display react app when application is bundled and ran
  outer.use(staticExpress(path.resolve(__dirname)))
  outer.get('/*splat', (__, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'))
  })

  outer.use((req, res) => {
    if (!ALLOWED_METHODS.includes(req.method) && knownPaths.has(req.path)) {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }
  })

  return outer
}
