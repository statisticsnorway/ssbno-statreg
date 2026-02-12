import type { Router } from 'express'
import { getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'
import { skipAuth } from '@/../plugins/authMiddleware'

export default function statisticsController(router: Router) {
  router.get('/statistics/:shortname', skipAuth, async (req, res) => {
    const data = getStatisticByShortname(req.params?.shortname ?? '')
    res.json(data)
  })

  router.get('/statistics', skipAuth, async (req, res) => {
    try {
      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const data = await getAllStatistics({ start, count })
      res.json(data)
    } catch (error) {
      console.log(error)
      res.status(400).json(error)
    }
  })
}
