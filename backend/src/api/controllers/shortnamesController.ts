import { handleErrors } from '@/lib/prismaErrors'
import { getShortnames, createShortname } from '@/services/shortnamesService'
import { Router } from 'express'
import { requireAdminAuthorization, skipAuth } from '@/../plugins/authMiddleware'
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

  router.post('/shortnames', requireAdminAuthorization(), async (req, res) => {
    try {
      await createShortname(prisma, req.body)
      res.status(201).send()
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
