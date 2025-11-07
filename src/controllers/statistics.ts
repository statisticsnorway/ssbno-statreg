import { Router, Request, Response } from 'express'
import * as statisticsService from '../services/statisticsService'

const router = Router()

/**
 * GET /statistics
 * Returns all STATISTIKK records
 */
router.get('/statistics', async (_req: Request, res: Response) => {
  try {
    const statistics = await statisticsService.getAllStatistics()
    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

export default router
