import { createBlockedReleaseDay } from '@/services/calendarService'
import { Router } from 'express'
import { requireAudience } from 'plugins/authMiddleware'

export default function calendarController(router: Router) {
  router.post(
    '/calendar/blocked-release-days/:date',
    requireAudience('oauth2-proxy-ssbno-statreg-api'),
    async (req, res) => {
      const { blocked_comment } = req.body
      const date = req.params.date
      const result = await createBlockedReleaseDay(date, blocked_comment)
      res.json(result)
    }
  )
}
