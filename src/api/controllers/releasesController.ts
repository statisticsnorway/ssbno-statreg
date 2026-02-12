import { getAllReleases } from '@/services/releasesService'
import { Router } from 'express'
import { skipAuth } from 'plugins/authMiddleware'

export default function releasesController(router: Router) {
  router.get('/releases', skipAuth, async (req, res) => {
    try {
      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const data = await getAllReleases({ start, count })
      res.json(data)
    } catch (error) {
      console.log(error)
      res.status(400).json(error)
    }
  })
}
