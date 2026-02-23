import { handleErrors } from '@/lib/prismaErrors'
import { createBlockedReleaseDay } from '@/services/calendarService'
import { Router } from 'express'
import { requireUserGroupAuthorization } from 'plugins/authMiddleware'

export default function calendarController(router: Router) {
  router.post(
    '/calendar/blocked-release-days/:date',
    requireUserGroupAuthorization('ssbno-developers'),
    async (req, res) => {
      try {
        const { blocked_comment } = req.body
        const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date
        if (!date) return res.status(400).json('missing date query parameter')
        const result = await createBlockedReleaseDay(date, blocked_comment)
        res.json(result)
      } catch (error) {
        handleErrors(error, res)
      }
    }
  )
}
