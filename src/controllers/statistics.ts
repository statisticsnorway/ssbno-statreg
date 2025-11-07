import { Router, Request, Response } from 'express';
import * as statisticsService from '../services/statisticsService';

const router = Router();

/**
 * GET /statistics
 * Returns all STATISTIKK records
 */
router.get('/statistics', async (_req: Request, res: Response) => {
  try {
    const statistics = await statisticsService.getAllStatistics();
    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * POST /statistics
 * Creates a new STATISTIKK record
 */
router.post('/statistics', async (_req: Request, res: Response) => {
  try {
    // TODO: implement creation logic in statisticsService
    res.status(201).json({ message: 'Statistic created (placeholder)' });
  } catch (error) {
    console.error('Error creating statistic:', error);
    res.status(500).json({ error: 'Failed to create statistic' });
  }
});

/**
 * PUT /statistics/:id
 * Updates an existing STATISTIKK record
 */
router.put('/statistics/:id', async (_req: Request, res: Response) => {
  try {
    // TODO: implement update logic
    res.status(200).json({ message: 'Statistic updated (placeholder)' });
  } catch (error) {
    console.error('Error updating statistic:', error);
    res.status(500).json({ error: 'Failed to update statistic' });
  }
});

/**
 * DELETE /statistics/:id
 * Deletes a STATISTIKK record
 */
router.delete('/statistics/:id', async (_req: Request, res: Response) => {
  try {
    // TODO: implement delete logic
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting statistic:', error);
    res.status(500).json({ error: 'Failed to delete statistic' });
  }
});

export default router;
