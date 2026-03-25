import type { Router } from 'express'
import { getAllReleases, getReleaseById, createRelease, updateRelease } from '@/services/releasesService'
import { requireUserGroupAuthorization, skipAuth } from 'plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'
import { prisma } from '@/lib/prisma'

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
      const data = await getAllReleases({ start, count }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.put('/releases/:id', requireUserGroupAuthorization('ssbno-developers'), async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
      const result = await updateRelease(id!, req.body, prisma)
      res.json(result)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.post(
    '/statistics/:shortname/variants/:id/releases',
    requireUserGroupAuthorization('ssbno-developers'),
    async (req, res) => {
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
    }
  )
}
