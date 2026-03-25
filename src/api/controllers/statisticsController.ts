import type { Router } from 'express'
import { createStatistic, getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'
import { skipAuth } from '@/../plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'
import { prisma } from '@/lib/prisma'
import { requireUserGroupAuthorization } from 'plugins/authMiddleware'

export default function statisticsController(router: Router) {
  router.get('/statistics/:shortname', skipAuth, async (req, res) => {
    try {
      const data = await getStatisticByShortname(
        Array.isArray(req.params.shortname) ? (req.params.shortname[0] as string) : (req.params.shortname as string),
        prisma
      )
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.post('/statistics/:shortname', requireUserGroupAuthorization('ssbno-developers'), async (req, res) => {
    try {
      res.json(await createStatistic(prisma, req.body, req.params.shortname as string))
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/statistics', skipAuth, async (req, res) => {
    try {
      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const data = await getAllStatistics({ start, count }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })
}
