import { prisma } from '@/lib/prisma'
import { handleErrors } from '@/lib/prismaErrors'
import { getFrequencies } from '@/services/frequenciesService'
import { Router } from 'express'
import { skipAuth } from '@/../plugins/authMiddleware'

export default function frequencyController(router: Router) {
  router.get('/frequencies', skipAuth, async (_req, res) => {
    try {
      const result = await getFrequencies(prisma)
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
