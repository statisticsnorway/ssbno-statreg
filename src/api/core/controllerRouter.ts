import { Router, type RequestHandler } from 'express'
import statisticsController from '@/api/controllers/statisticsController'

export default function createControllerRouter(requireAuth: RequestHandler) {
  const controllerRouter = Router()

  // Default: everything below requires auth unless a route sets skipAuth
  controllerRouter.use(requireAuth)

  controllerRouter.use(statisticsController)

  return controllerRouter
}
