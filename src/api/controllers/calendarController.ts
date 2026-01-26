import { checkForKnownPrismaErrors } from '@/lib/prismaErrors'
import { createBlockedReleaseDay } from '@/services/calendarService'
import { Router } from 'express'
import { requireAudience } from 'plugins/authMiddleware'

export default function calendarController(router: Router) {
  router.post(
    '/calendar/blocked-release-days/:date',
    requireAudience('oauth2-proxy-ssbno-statreg-api'),
    async (req, res) => {
      try {
        const { blocked_comment } = req.body
        const date = req.params.date
        const result = await createBlockedReleaseDay(date, blocked_comment)
        res.json(result)
      } catch (error) {
        const knownErrorMessage = checkForKnownPrismaErrors(error as any)
        if (knownErrorMessage) {
          return res.status(400).json(knownErrorMessage)
        }
        console.log(error)
        res.status(400).json('Something went wrong')
      }
    }
  )
}
