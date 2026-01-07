import { getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'
import { Router } from 'express'
import { skipAuth, requireAudience } from '@/../plugins/authMiddleware'

const router = Router()

// Public because skipAuth
router.get('/statistics/:shortname', skipAuth, async (req, res) => {
  const data = getStatisticByShortname(req.params.shortname)
  res.json(data)
})

// Private + requireAudience
router.get('/statistics', requireAudience('oauth2-proxy-ssbno-statreg-api'), async (_req, res) => {
  const data = await getAllStatistics()
  res.json(data)
})

export default router
