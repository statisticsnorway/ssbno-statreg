import { Router, type RequestHandler } from 'express'
import statisticsController from '@/api/controllers/statisticsController'

const ACCEPTED_ROUTE_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'all']

function routeRegistration(router: Router, requireAuth: RequestHandler) {
  for (const method of ACCEPTED_ROUTE_METHODS) {
    const registerRoute = (router as any)[method].bind(router)
    ;(router as any)[method] = (path: any, ...handlers: any[]) => {
      const isPublicRoute = handlers.some((handler) => (handler as any).__skipAuth)
      const routeHandlers = handlers.filter((handler) => !(handler as any).__skipAuth)
      return isPublicRoute ? registerRoute(path, ...routeHandlers) : registerRoute(path, requireAuth, ...routeHandlers)
    }
  }
}

export default function controllerRouter(requireAuth: RequestHandler) {
  const router = Router()
  routeRegistration(router, requireAuth)
  statisticsController(router)
  return router
}
