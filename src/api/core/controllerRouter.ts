import { Router, type RequestHandler } from 'express'
import statisticsController from '@/api/controllers/statisticsController'

const CONTROLLERS = [statisticsController] as const

const ROUTE_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'all'] as const

function applyDefaultAuth(router: Router, requireAuth: RequestHandler) {
  for (const method of ROUTE_METHODS) {
    const original = router[method].bind(router)

    router[method] = ((path: any, ...handlers: any[]) => {
      const isPublicRoute = handlers.some((handler) => (handler as any).__skipAuth)
      const routeHandlers = handlers.filter((handler) => !(handler as any).__skipAuth)

      return isPublicRoute ? original(path, ...routeHandlers) : original(path, requireAuth, ...routeHandlers)
    }) as Router[typeof method]
  }
}

export default function controllerRouter(requireAuth: RequestHandler) {
  const router = Router()

  applyDefaultAuth(router, requireAuth)

  for (const controller of CONTROLLERS) {
    controller(router)
  }

  return router
}
