import { prisma } from '@/lib/prisma'
import { handleErrors } from '@/lib/prismaErrors'
import { getFrequencies } from '@/services/frequencyService'
import { Router } from 'express'

export default function frequencyController(router: Router) {
  router.get('/frequencies', async (_req, res) => {
    try {
      const result = await getFrequencies(prisma)
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
