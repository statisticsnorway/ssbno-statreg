import { Router, type RequestHandler } from 'express'
import statisticsController from '@/api/controllers/statisticsController'

export default function createControllerRouter(requireAuth: RequestHandler) {
  const controllerRouter = Router()
  controllerRouter.use(statisticsController(requireAuth))
  return controllerRouter
}
