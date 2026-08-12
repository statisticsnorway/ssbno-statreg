import { handleErrors } from '@/lib/prismaErrors'
import { getShortnames, getShortname, createShortname } from '@/services/shortnamesService'
import { Router } from 'express'
import { requireAdminAuthorization, skipAuth } from '@/../plugins/authMiddleware'
import { prisma } from '@/lib/prisma'
import { ensureString } from '@/lib/utils'

export default function shortnamesController(router: Router) {
  router.get('/shortnames', skipAuth, async (_req, res) => {
    try {
      const result = await getShortnames(prisma)
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })

  router.get('/shortnames/:shortname', skipAuth, async (req, res) => {
    try {
      res.json(await getShortname(prisma, ensureString(req.params.shortname)))
    } catch (error) {
      handleErrors(error, res)
    }
  })

  router.post('/shortnames', requireAdminAuthorization(), async (req, res) => {
    try {
      const result = await createShortname(prisma, req.body)
      res.status(201).json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
