import { Router, type RequestHandler } from 'express'
import { getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'

export default function statisticsController(requireAuth: RequestHandler) {
  const router = Router()

  router.get('/statistics/:shortname', async (req, res) => {
    const data = getStatisticByShortname(req.params.shortname)
    res.json(data)
  })

  router.get('/statistics', requireAuth, async (_req, res) => {
    const data = await getAllStatistics()
    res.json(data)
  })

  return router
}
