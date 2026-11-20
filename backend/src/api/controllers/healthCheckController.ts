import { prisma } from '@/lib/prisma'
import { handleErrors } from '@/lib/prismaErrors'
import { Router } from 'express'
import { skipAuth } from '@/../plugins/authMiddleware'
import { checkDatabaseHealth } from '@/services/healthService'

export default function healthCheckController(router: Router) {
  router.get('/ping', skipAuth, async (_req, res) => {
    try {
      await checkDatabaseHealth(prisma)
      res.status(200).json({
        status: 'ok',
        message: 'pong',
      })
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
