import { handleErrors } from '@/lib/prismaErrors'
import { Router } from 'express'
import { skipAuth } from 'plugins/authMiddleware'

export default function shortnamesController(router: Router) {
  router.get('/shortnames', skipAuth, async (req, res) => {
    try {
      const result = ['kpi', 'energi', 'befolkning']
      res.json(result)
    } catch (error) {
      handleErrors(error, res)
    }
  })
}
