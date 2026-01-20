import { createBlockedReleaseDay } from '@/services/calendarService'
import { Router } from 'express'
import { skipAuth } from 'plugins/authMiddleware'

export default function calendarController(router: Router) {
  router.post('/calendar/blocked-release-days/:date', skipAuth, async (req, res) => {
    console.log('Post blocked', req.body)
    const { blocked_comment } = req.body
    const date = req.params.date
    const result = await createBlockedReleaseDay(date, blocked_comment)
    res.json(result)
  })
}
