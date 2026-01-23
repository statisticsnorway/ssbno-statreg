import type { Router } from 'express'
import { getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'
import { skipAuth, requireUserGroupAuthorization } from '@/../plugins/authMiddleware'

export default function statisticsController(router: Router) {
  router.get('/statistics/:shortname', skipAuth, async (req, res) => {
    const data = getStatisticByShortname(
      Array.isArray(req.params.shortname) ? req.params.shortname[0] : req.params.shortname
    )
    res.json(data)
  })

  router.get('/statistics', requireUserGroupAuthorization('ssbno-developers'), async (_req, res) => {
    const data = await getAllStatistics()
    res.json(data)
  })
}
