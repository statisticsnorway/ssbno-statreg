import type { Router } from 'express'
import { getAllReleases, getReleaseById } from '@/services/releasesService'
import { skipAuth } from 'plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'
import { prisma } from '@/lib/prisma'

export default function releasesController(router: Router) {
  router.get('/releases/:id', skipAuth, async (req, res) => {
    // If id is undefined, controller will evaluate '/releases' instead
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const data = await getReleaseById(id!, prisma)
    res.json(data)
  })

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
}
