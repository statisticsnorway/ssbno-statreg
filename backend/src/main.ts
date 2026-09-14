import { createApp } from './app'
import { startServer } from '../plugins/expressServer'
import { prisma } from './lib/prisma'

const app = await createApp()
startServer(app, prisma)
