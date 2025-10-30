import type express from 'express';
import { Router } from 'express';
import * as statistics from './statistics';

export default function controllerRouter(app: express.Express) {
  const router = Router();

  // API routes
  router.get('/statistics', statistics.listAllStatistics);

  app.use(router);
}
