import { Router, type RequestHandler } from 'express'
import statisticsController from '@/api/controllers/statisticsController'

const CONTROLLERS = [statisticsController] as const

const ROUTE_METHODS = ['get', 'post', 'put', 'delete'] as const

function applyDefaultAuth(router: Router, requireAuthentication: RequestHandler) {
  for (const method of ROUTE_METHODS) {
    const original = router[method].bind(router)

    router[method] = ((path: any, ...handlers: any[]) => {
      const isPublicRoute = handlers.some((handler) => (handler as any).__skipAuth)
      const routeHandlers = handlers.filter((handler) => !(handler as any).__skipAuth)

      return isPublicRoute ? original(path, ...routeHandlers) : original(path, requireAuthentication, ...routeHandlers)
    }) as Router[typeof method]
  }
}

export default function controllerRouter(requireAuthentication: RequestHandler) {
  const router = Router()

  applyDefaultAuth(router, requireAuthentication)

  for (const controller of CONTROLLERS) {
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
