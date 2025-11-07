import { Router } from 'express';
import statisticsRouter from '../controllers/statistics';

const router = Router();

// Mount statistics controller
router.use('/', statisticsRouter);

export default router;
