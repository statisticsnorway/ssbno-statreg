import type { Router } from 'express'
import { getAllReleases } from '@/services/releasesService'
import { skipAuth } from 'plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'

export default function releasesController(router: Router) {
  router.get('/releases', skipAuth, async (req, res) => {
    try {
      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const data = await getAllReleases({ start, count })
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })
}
