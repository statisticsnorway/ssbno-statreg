import type { Router } from 'express'
import { getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'
import { getReleases } from '@/services/releasesService'
import { skipAuth } from '@/../plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'
import { prisma } from '@/lib/prisma'
import { param } from '../core/controllerUtils'

export default function statisticsController(router: Router) {
  router.get('/statistics/:shortname', skipAuth, async (req, res) => {
    try {
      const data = await getStatisticByShortname(param(req.params.shortname), prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/statistics', skipAuth, async (req, res) => {
    try {
      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const data = await getAllStatistics({ start, count }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/statistics/:shortname/releases', skipAuth, async (req, res) => {
    try {
      const shortname = param(req.params.shortname)
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
      const shortname = param(req.params.shortname)
      const variantId = Number(param(req.params.id))

      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined

      const data = await getReleases({ start, count, shortname, variantId }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })
}
