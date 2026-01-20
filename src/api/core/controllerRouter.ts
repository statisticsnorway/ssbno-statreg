import { Router, type RequestHandler } from 'express'
import statisticsController from '@/api/controllers/statisticsController'
import releasesController from '../controllers/releasesController'

const CONTROLLERS = [statisticsController, releasesController]

const ROUTE_METHODS = ['get', 'post', 'put', 'delete'] as const

function applyAuthByDefult(router: Router, requireAuth: RequestHandler) {
  for (const method of ROUTE_METHODS) {
    const original = router[method].bind(router)

    router[method] = ((path: any, ...handlers: any[]) => {
      const isPublicRoute = handlers.some((handler) => (handler as any).__skipAuth)
      const routeHandlers = handlers.filter((handler) => !(handler as any).__skipAuth)

      return isPublicRoute ? original(path, ...routeHandlers) : original(path, requireAuth, ...routeHandlers)
    }) as Router[typeof method]
  }
}

export default function controllerRouter(
  requireAuth: RequestHandler,
  // eslint-disable-next-line no-unused-vars
  controllers: ReadonlyArray<(router: Router) => void> = CONTROLLERS
) {
  const router = Router()

  applyAuthByDefult(router, requireAuth)

  for (const controller of controllers) {
    controller(router)
  }

  router.use((req, res, next) => {
    if (!ROUTE_METHODS.map((m) => m.toUpperCase()).includes(req.method)) {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }
    next()
  })

  router.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' })
  })

  return router
}
