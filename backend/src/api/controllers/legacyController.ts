import { prisma } from '@/lib/prisma'
import { handleErrors } from '@/lib/prismaErrors'
import { getApprovedStatisticsXml } from '@/services/legacyService'
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
}
