import { prisma } from '@/lib/prisma'
import { handleErrors } from '@/lib/prismaErrors'
import { getApprovedStatisticsXml } from '@/services/legacy/approvedStatisticsXml'
import { listReleasedPublications } from '@/services/legacy/releasedPublications'
import { listReleasedStatistics } from '@/services/legacy/releasedStatistics'
import { Router } from 'express'
import { skipAuth } from '@/../plugins/authMiddleware'

export default function legacyController(router: Router) {
  router.get('/legacy/listSorterteAktiveKortnavnSomXml', skipAuth, async (_req, res) => {
    try {
      const xml = await getApprovedStatisticsXml(prisma)
      res.type('application/xml').send(xml)
    } catch (error) {
      handleErrors(error, res)
    }
  })

  router.get('/legacy/statistikk/listAllReleasedAsJson', skipAuth, async (_req, res) => {
    try {
      const json = await listReleasedStatistics(prisma)
      res.json(json)
    } catch (error) {
      handleErrors(error, res)
    }
  })

  router.get('/legacy/publisering/listAllReleasedAsJson', skipAuth, async (_req, res) => {
    try {
      const json = await listReleasedPublications(prisma)
      res.json(json)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
