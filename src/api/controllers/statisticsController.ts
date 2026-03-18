import type { Router } from 'express'
import { getAllStatistics, getStatisticByShortname } from '@/services/statisticsService'
import { getAllReleases } from '@/services/releasesService'
import { skipAuth } from '@/../plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'
import { prisma } from '@/lib/prisma'

export default function statisticsController(router: Router) {
  router.get('/statistics/:shortname', skipAuth, async (req, res) => {
    try {
      const data = await getStatisticByShortname(
        Array.isArray(req.params.shortname) ? (req.params.shortname[0] as string) : (req.params.shortname as string),
        prisma
      )
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
      const shortname = Array.isArray(req.params.shortname) ? req.params.shortname[0] : req.params.shortname
      if (!shortname) return res.status(400).json({ error: 'Missing shortname' })
      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const data = await getAllReleases({ start, count, shortname }, prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/statistics/:shortname/variants/:id/releases', skipAuth, async (req, res) => {
    try {
      const shortnameParam = Array.isArray(req.params.shortname) ? req.params.shortname[0] : req.params.shortname
      const idParam = req.params.id

      if (typeof shortnameParam !== 'string' || shortnameParam.trim() === '') {
        return res.status(400).json({ error: 'Invalid or missing shortname' })
      }

      const variantId = Number(idParam)
      if (!idParam || Number.isNaN(variantId)) {
        return res.status(400).json({ error: 'Invalid variant id' })
      }

      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const data = await getAllReleases({ start, count, shortname: shortnameParam, variantId }, prisma)

      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })
}
