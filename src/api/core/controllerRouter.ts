import { Router, type RequestHandler } from 'express'
import statisticsController from '@/api/controllers/statisticsController'

export default function controllerRouter(requireAuth: RequestHandler) {
  const controllerRouter = Router()
  controllerRouter.use(requireAuth) //applies middleware to all routes bellow

  controllerRouter.use(statisticsController)

  return controllerRouter
}
