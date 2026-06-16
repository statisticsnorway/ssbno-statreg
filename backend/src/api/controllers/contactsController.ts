import { handleErrors } from '@/lib/prismaErrors'
import { getContacts } from '@/services/contactsService'
import { Router } from 'express'
import { skipAuth } from 'plugins/authMiddleware'
import { prisma } from '@/lib/prisma'

export default function contactsController(router: Router) {
  router.get('/contacts', skipAuth, async (_req, res) => {
    try {
      const result = await getContacts(prisma)
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
