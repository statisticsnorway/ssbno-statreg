import { createBlockedReleaseDay } from '@/services/calendarService'
import { Router } from 'express'
import { requireUserAuthorization } from 'plugins/authMiddleware'

export default function calendarController(router: Router) {
  router.post(
    '/calendar/blocked-release-days/:date',
    requireUserAuthorization('ssbno-developers'),
    async (req, res) => {
      const { blocked_comment } = req.body
      const date = req.params.date
      const result = await createBlockedReleaseDay(date, blocked_comment)
      //TODO: Should return list of blocked days, not just added block day
      res.json(result)
    }
  )
}
