import { getDivisionsCache } from '@/lib/cache'
import { handleErrors } from '@/lib/prismaErrors'

import { Router } from 'express'

export default function divisionsController(router: Router) {
  router.get('/divisions', async (_req, res) => {
    try {
      const result = await getDivisionsCache()
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
