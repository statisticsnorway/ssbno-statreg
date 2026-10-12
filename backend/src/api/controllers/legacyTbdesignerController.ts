import type { RequestHandler } from 'express'
import { prisma } from '@/lib/prisma'
import { handleErrors } from '@/lib/prismaErrors'
import { getApprovedStatisticsXml } from '@/services/legacyTbdesignerService'

export function legacyTbdesignerHandler(): RequestHandler {
  return async (_req, res) => {
    try {
      const xml = await getApprovedStatisticsXml(prisma)
      res.type('application/xml').send(xml)
    } catch (error) {
      return handleErrors(error, res)
    }
  }
}
