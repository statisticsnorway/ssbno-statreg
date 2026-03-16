import { prisma } from '@/lib/prisma'
import { handleErrors } from '@/lib/prismaErrors'
import { createBlockedReleaseDay, deleteBlockedReleaseDay, updateBlockedReleaseDay } from '@/services/calendarService'
import { Router } from 'express'
import { requireUserGroupAuthorization } from 'plugins/authMiddleware'

export default function calendarController(router: Router) {
  router.post(
    '/calendar/blocked-release-days/:date',
    requireUserGroupAuthorization('ssbno-developers'),
    async (req, res) => {
      try {
        const result = await createBlockedReleaseDay(prisma, req.params.date, req.body)
        res.json(result)
      } catch (error) {
        handleErrors(error, res)
      }
    }
  )

  router.put(
    '/calendar/blocked-release-days/:date',
    requireUserGroupAuthorization('ssbno-developers'),
    async (req, res) => {
      try {
        const result = await updateBlockedReleaseDay(prisma, req.params.date, req.body)
        res.json(result)
      } catch (error) {
        handleErrors(error, res)
      }
    }
  )

  router.delete(
    '/calendar/blocked-release-days/:date',
    requireUserGroupAuthorization('ssbno-developers'),
    async (req, res) => {
      try {
        const result = await deleteBlockedReleaseDay(prisma, req.params.date)
        res.json(result)
      } catch (error) {
        handleErrors(error, res)
      }
    }
  )
}
