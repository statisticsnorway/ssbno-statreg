import type { Router } from 'express'
import { getReleases, getReleaseById, createRelease, updateRelease } from '@/services/releasesService'
import { requireAdminAuthorization, skipAuth } from 'plugins/authMiddleware'
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
      const data = await getReleases({ start, count }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.put('/releases/:id', requireAdminAuthorization(), async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
      const result = await updateRelease(id!, req.body, prisma)
      res.json(result)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/statistics/:shortname/releases', skipAuth, async (req, res) => {
    try {
      const shortname = ensureString(req.params.shortname)

      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined

      const data = await getReleases({ start, count, shortname }, prisma)

      res.json(data)
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

      const data = await getReleases({ start, count, shortname, variantId }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/statistics/:shortname/releases', skipAuth, async (req, res) => {
    try {
      const shortname = ensureString(req.params.shortname)

      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined

      const data = await getReleases({ start, count, shortname }, prisma)

      res.json(data)
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

      const data = await getReleases({ start, count, shortname, variantId }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.post('/statistics/:shortname/variants/:id/releases', requireAdminAuthorization(), async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
      const now = new Date()
      const result = await createRelease(
        prisma,
        Array.isArray(req.params.shortname) ? (req.params.shortname[0] as string) : (req.params.shortname as string),
        id!,
        now,
        req.body
      )
      res.json(result)
    } catch (error) {
      return handleErrors(error, res)
    }
  })
}
