import type { Router } from 'express'
import { getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'
import { skipAuth } from '@/../plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'

export default function statisticsController(router: Router) {
  router.get('/statistics/:shortname', skipAuth, async (req, res) => {
    try {
      const data = await getStatisticByShortname(
        Array.isArray(req.params.shortname) ? req.params.shortname[0] : req.params.shortname
      )
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/statistics', skipAuth, async (req, res) => {
    try {
      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const data = await getAllStatistics({ start, count })
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })
}
