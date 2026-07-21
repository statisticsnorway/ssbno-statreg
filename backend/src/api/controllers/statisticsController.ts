import type { Router } from 'express'
import {
  createStatistic,
  getStatisticByShortname,
  updateStatistic,
  updateContacts,
  getFilteredStatistics,
} from '@/services/statisticsService'
import { requireAdminAuthorization, skipAuth } from '@/../plugins/authMiddleware'
import { handleErrors } from '@/lib/prismaErrors'
import { prisma } from '@/lib/prisma'
import { ensureString, ensureStringArray } from '@/lib/utils'
import { postStatisticsByShortnameBody, putStatisticsByShortnameBody } from '@/parser'

export default function statisticsController(router: Router) {
  router.get('/statistics/:shortname', skipAuth, async (req, res) => {
    try {
      const data = await getStatisticByShortname(ensureString(req.params.shortname), prisma)
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.post('/statistics/:shortname', requireAdminAuthorization(), async (req, res) => {
    try {
      const parsedBody = postStatisticsByShortnameBody.parse(req.body)
      res.json(await createStatistic(prisma, ensureString(req.params.shortname), parsedBody))
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.get('/statistics', skipAuth, async (req, res) => {
    try {
      const start = req.query?.start ? Number(req.query.start) : undefined
      const count = req.query?.count ? Number(req.query.count) : undefined
      const sort = ensureString(req.query.sort as string) || undefined
      const filterByShortnames = ensureStringArray(req.query.shortname as string)
      const filterByContactPrincipalName = ensureStringArray(req.query.contact as string)

      const data = await getFilteredStatistics(
        { start, count, filterByShortnames, filterByContactPrincipalName, sort },
        prisma
      )
      res.json(data)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.put('/statistics/:shortname', requireAdminAuthorization(), async (req, res) => {
    try {
      const parsedBody = putStatisticsByShortnameBody.parse(req.body)
      const result = await updateStatistic(ensureString(req.params.shortname), parsedBody, prisma)
      res.json(result)
    } catch (error) {
      return handleErrors(error, res)
    }
  })

  router.put('/statistics/:shortname/contacts', async (req, res) => {
    try {
      const input = req.body.principalNames
      if (!Array.isArray(input) || !input.every((item) => typeof item === 'string')) {
        throw { status: 400, statregError: 'principalNames must be an array of strings' }
      }
      const result = await updateContacts(ensureString(req.params.shortname), input, prisma)
      res.json(result)
    } catch (error) {
      return handleErrors(error, res)
    }
  })
}
