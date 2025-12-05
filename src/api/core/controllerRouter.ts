import { Router } from 'express'
import statisticsController from '@/api/controllers/statisticsController'

const controllerRouter = Router()
controllerRouter.use(statisticsController)

export default controllerRouter
