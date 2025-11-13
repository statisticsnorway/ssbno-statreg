import express, { Request, Response } from 'express'
import helmet from 'helmet'
import controllerRouter from './api/core/controllerRouter'
import { startServer } from '../plugins/expressServer'
import { promBundleMetrics } from '../plugins/promBundle'

const expressInstance = express()
expressInstance.use(helmet())
expressInstance.use(promBundleMetrics)
expressInstance.use(controllerRouter)
expressInstance.get('/', (_: Request, res: Response) => res.send('STATREG-API-V1'))
startServer(expressInstance)
