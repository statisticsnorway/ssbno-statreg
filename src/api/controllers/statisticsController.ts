import { getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'
import { Router } from 'express'

const router = Router()

router.get('/statistics/:shortname', async (req, res) => {
  const shortname = req.params.shortname
  const data = getStatisticByShortname(shortname)
  res.json(data)
})

router.get('/statistics', async (_req, res) => {
  const data = await getAllStatistics()
  res.json(data)
})

export default router
