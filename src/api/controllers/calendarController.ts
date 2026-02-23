import { prisma } from '@/lib/prisma'
import { handleErrors } from '@/lib/prismaErrors'
import { createBlockedReleaseDay } from '@/services/calendarService'
import { Router } from 'express'
import { requireUserGroupAuthorization } from 'plugins/authMiddleware'

//TODO: Blir det riktig med validering av input her? Skal vi i så fall også ha tester for kontrollere?
export default function calendarController(router: Router) {
  router.post(
    '/calendar/blocked-release-days/:date',
    requireUserGroupAuthorization('ssbno-developers'),
    async (req, res) => {
      try {
        const blocked_comment = req.body?.blocked_comment
        if (!blocked_comment) return res.status(400).json('blocked comment missing')
        const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date
        if (!date) return res.status(400).json('missing date query parameter')
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(date)) return res.status(400).json('invalid date format')
        const result = await createBlockedReleaseDay(date, blocked_comment, prisma)
        res.json(result)
      } catch (error) {
        handleErrors(error, res)
      }
    }
  )
}
