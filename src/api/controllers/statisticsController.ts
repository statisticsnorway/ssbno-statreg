import type { Router } from 'express'
import { getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'
import { skipAuth, requireAudience } from '@/../plugins/authMiddleware'

export default function statisticsController(router: Router) {
  router.get('/statistics/:shortname', skipAuth, async (req, res) => {
    const data = getStatisticByShortname(req.params.shortname)
    res.json(data)
  })

  router.get('/statistics', requireAudience('ssbno-statreg-api-test'), async (_req, res) => {
    const data = await getAllStatistics()
    res.json(data)
  })
}
