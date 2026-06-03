import { prisma } from '@/lib/prisma'
import { handleErrors } from '@/lib/prismaErrors'
import { createBlockedReleaseDay, getBlockedReleaseDays, getDateStatusForRange } from '@/services/calendarService'
import { Router } from 'express'
import { requireAdminAuthorization, skipAuth } from 'plugins/authMiddleware'

export default function calendarController(router: Router) {
  router.get('/calendar/blocked-release-days', skipAuth, async (req, res) => {
    try {
      const result = await getBlockedReleaseDays()
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })

  router.post('/calendar/blocked-release-days/:date', requireAdminAuthorization(), async (req, res) => {
    try {
      const result = await createBlockedReleaseDay(prisma, req.params.date, req.body)
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })

  router.get('/calendar', skipAuth, async (req, res) => {
    try {
      const from = req.query?.fromDate?.toString()
      const to = req.query?.toDate?.toString()
      const result = await getDateStatusForRange(prisma, from, to)
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
