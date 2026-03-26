import type { Router } from 'express'
import {
  createStatistic,
  getAllStatistics,
  getStatisticByShortname,
  updateStatistic,
} from '@/services/statisticsService'
import { requireAdminAuthorization, skipAuth } from '@/../plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'
import { prisma } from '@/lib/prisma'

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

  router.post('/statistics/:shortname', requireAdminAuthorization(), async (req, res) => {
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

  router.put('/statistics/:shortname', requireAdminAuthorization(), async (req, res) => {
    try {
      const shortname = Array.isArray(req.params.shortname) ? req.params.shortname[0] : req.params.shortname
      const result = await updateStatistic(shortname!, req.body, prisma)
      res.json(result)
    } catch (error) {
      return handleErrors(error, res)
    }
  })
}
