import type { Router } from 'express'
import {
  getVariantReleases,
  getFilteredReleases,
  getReleaseById,
  createRelease,
  updateRelease,
} from '@/services/releasesService'
import { skipAuth } from 'plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'
import { prisma } from '@/lib/prisma'
import { ensureString } from '@/lib/utils'

export default function releasesController(router: Router) {
  router.get('/releases/:id', skipAuth, async (req, res) => {
    try {
      // If id is undefined, controller will evaluate '/releases' instead
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
      const data = await getReleaseById(id!, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/releases', skipAuth, async (req, res) => {
    try {
      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const filterByShortnames = typeof req.query.shortname === 'string' ? req.query.shortname?.split(',') : undefined
      const data = await getFilteredReleases({ start, count, filterByShortnames }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.put('/releases/:id', skipAuth, async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
      const result = await updateRelease(prisma, id!, req.body)
      res.json(result)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/statistics/:shortname/variants/:id/releases', skipAuth, async (req, res) => {
    try {
      const shortname = ensureString(req.params.shortname)
      const variantId = Number(ensureString(req.params.id))

      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined

      const data = await getVariantReleases({ start, count, shortname, variantId }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.post('/statistics/:shortname/variants/:id/releases', skipAuth, async (req, res) => {
    try {
      const result = await createRelease(
        prisma,
        ensureString(req.params.shortname),
        ensureString(req.params.id),
        req.body
      )
      res.json(result)
    } catch (error) {
      return handleErrors(error, res)
    }
  })
}
