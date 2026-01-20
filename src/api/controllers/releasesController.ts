import { getAllReleases } from '@/services/releasesService'
import { Router } from 'express'
import { skipAuth } from 'plugins/authMiddleware'

export default function releasesController(router: Router) {
  router.get('/releases', skipAuth, async (_req, res) => {
    const data = await getAllReleases()
    res.json(data)
  })
}
