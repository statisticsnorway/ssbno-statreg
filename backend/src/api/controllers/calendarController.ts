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

  router.get('/calendar/:fromYear-:fromMonth-:fromDay-:toYear-:toMonth-:toDay', skipAuth, async (req, res) => {
    try {
      // TODO MIM-2661: Refactor and make sure errors are handled
      const { fromYear, fromMonth, fromDay, toYear, toMonth, toDay } = req.params
      const from = fromYear + '-' + fromMonth + '-' + fromDay
      const to = toYear + '-' + toMonth + '-' + toDay
      const result = await getDateStatusForRange(prisma, from, to)
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
