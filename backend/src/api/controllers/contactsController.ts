import { handleErrors } from '@/lib/prismaErrors'
import { getContacts } from '@/services/contactsService'
import { Router } from 'express'
import { prisma } from '@/lib/prisma'

export default function contactsController(router: Router) {
  router.get('/contacts', async (_req, res) => {
    try {
      const result = await getContacts(prisma)
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
