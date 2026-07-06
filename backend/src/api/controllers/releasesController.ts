import type { Router } from 'express'
import {
  getVariantReleases,
  getFilteredReleases,
  getReleaseById,
  createRelease,
  updateRelease,
} from '@/services/releasesService'
import { skipAuth } from '@/../plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'
import { prisma } from '@/lib/prisma'
import { ensureString, ensureStringArray } from '@/lib/utils'

export default function releasesController(router: Router) {
  router.get('/releases/:id', skipAuth, async (req, res) => {
    try {
      // If id is undefined, controller will evaluate '/releases' instead
      const id = ensureString(req.params.id)
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
      const publishTimeAfter = req.query?.publish_time_after?.toString()
      const publishTimeBefore = req.query?.publish_time_before?.toString()
      const sort = typeof req.query?.sort == 'string' ? req?.query?.sort : undefined
      const filterByShortnames = ensureStringArray(req.query.shortname as string)
      const approvalStatus = ensureString(req.query.approval_status as string)

      const data = await getFilteredReleases(
        { start, count, filterByShortnames, publishTimeAfter, publishTimeBefore, sort, approvalStatus },
        prisma
      )
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.put('/releases/:id', async (req, res) => {
    try {
      const id = ensureString(req.params.id)
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
      const sort = typeof req.query?.sort == 'string' ? req?.query?.sort : undefined

      const data = await getVariantReleases({ start, count, shortname, variantId, sort }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.post('/statistics/:shortname/variants/:id/releases', async (req, res) => {
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
