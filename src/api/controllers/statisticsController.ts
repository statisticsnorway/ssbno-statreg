import { getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'
import { Router } from 'express'
import { skipAuth } from '@/../plugins/authMiddleware'

const router = Router()

// Public: explicitly skips default auth
router.get('/statistics/:shortname', skipAuth, async (req, res) => {
  const data = getStatisticByShortname(req.params.shortname)
  res.json(data)
})

// Private: protected by controllerRouter default auth
router.get('/statistics', async (_req, res) => {
  const data = await getAllStatistics()
  res.json(data)
})

export default router
