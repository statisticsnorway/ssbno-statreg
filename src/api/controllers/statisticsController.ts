import { Router } from 'express'
import * as statisticsService from '@/services/statisticsService'

const router = Router()

router.get('/statistics', async (_req, res) => {
  try {
    const data = await statisticsService.getAllStatistics()
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
