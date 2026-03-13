import type { Router } from 'express'
import { getAllReleases, getReleasesForStatistic } from '@/services/releasesService'
import { skipAuth } from 'plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'
import { prisma } from '@/lib/prisma'

export default function releasesController(router: Router) {
  router.get('/releases', skipAuth, async (req, res) => {
    try {
      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const data = await getAllReleases({ start, count }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/releases/:shortname', skipAuth, async (req, res) => {
    try {
      const shortname = Array.isArray(req.params.shortname) ? req.params.shortname[0] : req.params.shortname

      if (!shortname) {
        return res.status(400).json({ error: 'Missing shortname' })
      }

      const data = await getReleasesForStatistic(shortname, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })
}
