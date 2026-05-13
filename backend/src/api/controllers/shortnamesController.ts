import { handleErrors } from '@/lib/prismaErrors'
import { getShortnames } from '@/services/shortnamesService'
import { Router } from 'express'
import { skipAuth } from 'plugins/authMiddleware'
import { prisma } from '@/lib/prisma'

export default function shortnamesController(router: Router) {
  router.get('/shortnames', skipAuth, async (_req, res) => {
    try {
      const result = await getShortnames(prisma)
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
