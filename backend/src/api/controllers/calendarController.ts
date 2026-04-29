import { prisma } from '@/lib/prisma'
import { handleErrors } from '@/lib/prismaErrors'
import { createBlockedReleaseDay, getDateStatusForRange } from '@/services/calendarService'
import { Router } from 'express'
import { requireAdminAuthorization, skipAuth } from 'plugins/authMiddleware'

export default function calendarController(router: Router) {
  router.post('/calendar/blocked-release-days/:date', requireAdminAuthorization(), async (req, res) => {
    try {
      const result = await createBlockedReleaseDay(prisma, req.params.date, req.body)
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })

  // TODO MIM-2546 Locally the dates are one day off due to inconsistently handleing GMT vs local timezone
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
